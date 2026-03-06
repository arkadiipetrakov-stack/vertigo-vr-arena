document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('booking-form');
  if (!form) return;

  // ------------------------------------------------
  // 1. Phone mask: +7 (___) ___-__-__
  // ------------------------------------------------
  const phoneInput = form.querySelector('[name="phone"]');
  if (phoneInput) {
    const formatPhone = (digits) => {
      // Always start with 7
      if (digits.startsWith('8')) digits = '7' + digits.slice(1);
      if (!digits.startsWith('7') && digits.length > 0) digits = '7' + digits;

      let formatted = '';
      if (digits.length >= 1) formatted = '+7';
      if (digits.length > 1) formatted += ' (' + digits.slice(1, 4);
      if (digits.length > 4) formatted += ') ' + digits.slice(4, 7);
      if (digits.length > 7) formatted += '-' + digits.slice(7, 9);
      if (digits.length > 9) formatted += '-' + digits.slice(9, 11);

      return formatted;
    };

    phoneInput.addEventListener('input', (e) => {
      const cursorPos = e.target.selectionStart;
      const prevLength = e.target.value.length;
      let value = e.target.value.replace(/\D/g, '');

      // Limit to 11 digits
      value = value.slice(0, 11);

      e.target.value = formatPhone(value);

      // Try to maintain cursor position
      const diff = e.target.value.length - prevLength;
      const newPos = cursorPos + diff;
      e.target.setSelectionRange(newPos, newPos);
    });

    phoneInput.addEventListener('focus', (e) => {
      if (!e.target.value) {
        e.target.value = '+7 (';
      }
    });

    phoneInput.addEventListener('blur', (e) => {
      const stripped = e.target.value.replace(/\D/g, '');
      if (stripped.length <= 1) {
        e.target.value = '';
      }
    });

    // Handle paste
    phoneInput.addEventListener('paste', (e) => {
      e.preventDefault();
      const pasted = (e.clipboardData || window.clipboardData).getData('text');
      let digits = pasted.replace(/\D/g, '').slice(0, 11);
      if (digits.startsWith('8')) digits = '7' + digits.slice(1);
      if (!digits.startsWith('7') && digits.length > 0) digits = '7' + digits;
      phoneInput.value = formatPhone(digits);
    });

    // Prevent non-numeric characters (except control keys)
    phoneInput.addEventListener('keydown', (e) => {
      const allowed = [
        'Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight',
        'Home', 'End'
      ];
      if (allowed.includes(e.key) || e.ctrlKey || e.metaKey) return;
      if (!/\d/.test(e.key)) {
        e.preventDefault();
      }
    });
  }

  // ------------------------------------------------
  // 2. Date min = today
  // ------------------------------------------------
  const dateInput = form.querySelector('[name="date"]');
  if (dateInput) {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    dateInput.setAttribute('min', `${year}-${month}-${day}`);

    // Set max to 6 months from now
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 6);
    const maxYear = maxDate.getFullYear();
    const maxMonth = String(maxDate.getMonth() + 1).padStart(2, '0');
    const maxDay = String(maxDate.getDate()).padStart(2, '0');
    dateInput.setAttribute('max', `${maxYear}-${maxMonth}-${maxDay}`);
  }

  // ------------------------------------------------
  // 3. Children count: enforce min/max in UI
  // ------------------------------------------------
  const childrenInput = form.querySelector('[name="children"]');
  if (childrenInput) {
    childrenInput.addEventListener('input', () => {
      let val = parseInt(childrenInput.value, 10);
      if (val > 16) childrenInput.value = 16;
      if (val < 0) childrenInput.value = '';
    });
  }

  // ------------------------------------------------
  // 4. Form validation
  // ------------------------------------------------
  const showError = (input, message) => {
    if (!input) return;
    const group = input.closest('.form__group');
    if (!group) return;

    input.classList.add('form__input--error');

    let errorEl = group.querySelector('.form__error');
    if (!errorEl) {
      errorEl = document.createElement('span');
      errorEl.classList.add('form__error');
      group.appendChild(errorEl);
    }
    errorEl.textContent = message;
    errorEl.style.display = 'block';
  };

  const clearError = (input) => {
    if (!input) return;
    const group = input.closest('.form__group');
    if (!group) return;

    input.classList.remove('form__input--error');

    const errorEl = group.querySelector('.form__error');
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.style.display = 'none';
    }
  };

  const validate = () => {
    let isValid = true;

    // Name validation
    const nameInput = form.querySelector('[name="name"]');
    if (nameInput) {
      const nameVal = nameInput.value.trim();
      if (!nameVal) {
        showError(nameInput, 'Введите ваше имя');
        isValid = false;
      } else if (nameVal.length < 2) {
        showError(nameInput, 'Имя должно содержать минимум 2 символа');
        isValid = false;
      } else {
        clearError(nameInput);
      }
    }

    // Phone validation
    const phoneField = form.querySelector('[name="phone"]');
    if (phoneField) {
      const phoneDigits = phoneField.value.replace(/\D/g, '');
      if (phoneDigits.length < 11) {
        showError(phoneField, 'Введите корректный номер телефона');
        isValid = false;
      } else {
        clearError(phoneField);
      }
    }

    // Date validation
    const dateField = form.querySelector('[name="date"]');
    if (dateField) {
      if (!dateField.value) {
        showError(dateField, 'Выберите дату праздника');
        isValid = false;
      } else {
        const selectedDate = new Date(dateField.value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selectedDate < today) {
          showError(dateField, 'Дата не может быть в прошлом');
          isValid = false;
        } else {
          clearError(dateField);
        }
      }
    }

    // Children count validation
    const childrenField = form.querySelector('[name="children"]');
    if (childrenField) {
      const childrenVal = parseInt(childrenField.value, 10);
      if (!childrenField.value || isNaN(childrenVal)) {
        showError(childrenField, 'Укажите количество детей');
        isValid = false;
      } else if (childrenVal < 4) {
        showError(childrenField, 'Минимальное количество детей - 4');
        isValid = false;
      } else if (childrenVal > 16) {
        showError(childrenField, 'Максимальное количество детей - 16');
        isValid = false;
      } else {
        clearError(childrenField);
      }
    }

    return isValid;
  };

  // ------------------------------------------------
  // 5. Form submission
  // ------------------------------------------------
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!validate()) {
      // Scroll to first error
      const firstError = form.querySelector('.form__input--error');
      if (firstError) {
        firstError.focus();
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // Disable submit button to prevent double submission
    const submitBtn = form.querySelector('[type="submit"], .form__submit');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.classList.add('btn--loading');
    }

    const formData = new FormData(form);
    const name = formData.get('name');
    const phone = formData.get('phone');
    const date = formData.get('date');
    const children = formData.get('children');
    const pkg = formData.get('package') || 'Не выбран';

    // Format date for display
    let formattedDate = date;
    if (date) {
      const dateObj = new Date(date + 'T00:00:00');
      formattedDate = dateObj.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }

    // Since no backend, redirect to WhatsApp with pre-filled message
    const message =
      'Здравствуйте! Хочу забронировать день рождения.\n\n' +
      'Имя: ' + name + '\n' +
      'Телефон: ' + phone + '\n' +
      'Дата: ' + formattedDate + '\n' +
      'Количество детей: ' + children + '\n' +
      'Пакет: ' + pkg;

    const whatsappUrl = 'https://wa.me/79027100210?text=' + encodeURIComponent(message);

    // Show success state
    const formWrapper = form.closest('.booking__form-wrapper') || form.parentElement;
    if (formWrapper) {
      formWrapper.innerHTML =
        '<div class="booking__success">' +
          '<div class="booking__success-icon">' +
            '<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">' +
              '<circle cx="32" cy="32" r="30" stroke="#22c55e" stroke-width="2"/>' +
              '<path d="M20 32L28 40L44 24" stroke="#22c55e" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>' +
            '</svg>' +
          '</div>' +
          '<h3 class="booking__success-title">Заявка отправлена!</h3>' +
          '<p class="booking__success-text">Мы свяжемся с вами в течение 15 минут для подтверждения брони.</p>' +
          '<a href="' + whatsappUrl + '" target="_blank" rel="noopener" class="btn btn--whatsapp" style="margin-top:20px;">' +
            '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="margin-right:8px;vertical-align:middle;">' +
              '<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>' +
              '<path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.612.638l4.67-1.388A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.239 0-4.326-.726-6.02-1.956l-.42-.314-2.767.823.745-2.812-.34-.447A9.955 9.955 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>' +
            '</svg>' +
            'Написать в WhatsApp' +
          '</a>' +
        '</div>';

      // Animate success state in with GSAP if available
      if (typeof gsap !== 'undefined') {
        const successEl = formWrapper.querySelector('.booking__success');
        if (successEl) {
          gsap.from(successEl, {
            scale: 0.9,
            autoAlpha: 0,
            duration: 0.5,
            ease: 'back.out(1.4)'
          });
          // Animate the checkmark SVG path
          const checkPath = successEl.querySelector('path');
          const circle = successEl.querySelector('circle');
          if (circle) {
            const circumference = 2 * Math.PI * 30;
            gsap.fromTo(circle,
              { strokeDasharray: circumference, strokeDashoffset: circumference },
              { strokeDashoffset: 0, duration: 0.8, ease: 'power2.out' }
            );
          }
          if (checkPath) {
            gsap.from(checkPath, {
              autoAlpha: 0,
              delay: 0.5,
              duration: 0.4
            });
          }
        }
      }
    }

    // Open WhatsApp in new tab
    window.open(whatsappUrl, '_blank');
  });

  // ------------------------------------------------
  // 6. Real-time validation on blur
  // ------------------------------------------------
  form.querySelectorAll('.form__input, .form__select').forEach(input => {
    input.addEventListener('blur', () => {
      // Only validate the field that lost focus
      const fieldName = input.getAttribute('name');
      if (!fieldName) return;

      const value = input.value;

      switch (fieldName) {
        case 'name':
          if (!value.trim()) {
            showError(input, 'Введите ваше имя');
          } else if (value.trim().length < 2) {
            showError(input, 'Имя должно содержать минимум 2 символа');
          } else {
            clearError(input);
          }
          break;

        case 'phone': {
          const digits = value.replace(/\D/g, '');
          if (digits.length > 1 && digits.length < 11) {
            showError(input, 'Введите корректный номер телефона');
          } else if (digits.length >= 11) {
            clearError(input);
          }
          break;
        }

        case 'date':
          if (value) {
            const selectedDate = new Date(value);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (selectedDate < today) {
              showError(input, 'Дата не может быть в прошлом');
            } else {
              clearError(input);
            }
          }
          break;

        case 'children': {
          const num = parseInt(value, 10);
          if (value && !isNaN(num)) {
            if (num < 4) {
              showError(input, 'Минимальное количество детей - 4');
            } else if (num > 16) {
              showError(input, 'Максимальное количество детей - 16');
            } else {
              clearError(input);
            }
          }
          break;
        }
      }
    });

    // Clear error on focus/input (immediate feedback)
    input.addEventListener('input', () => {
      if (input.classList.contains('form__input--error')) {
        clearError(input);
      }
    });
  });
});
