document.addEventListener('alpine:init', function(e) {
  const validate = (function () {
    const ruleFns = {
      required: (input) => !!input,
      email: (input) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(input),
      phone: (input, splitter='') => new RegExp(`^\\d{3}${splitter}\\d{3,4}${splitter}\\d{4}$`).test(input),
      number: (input) => !isNaN(+input),
      maxSize: (input, max=0) => max === 0 ? true : input.length <= max,
      minSize: (input, min=999_999_999) => min === 999_999_999 ? true : input.length >= min,
    };
    
    return {
      base (input='', rules=[]) {
        return rules.reduce(
          (obj, [rule, option]) => {
            const fn = ruleFns[rule];
            if (fn) {
              const result = fn(input, option?.replace(/["']/g, ''));
              obj[rule] = result;
            }
            return obj;
          },
          { valid: true, invalid: false }
        );
      },
      check (input='', rules=[]) {
        let isRequired = false;

        const obj = rules.reduce(
          (obj, [rule, option]) => {
            isRequired = isRequired || rule === 'required';
            const fn = ruleFns[rule];
            if (fn) {
              const result = fn(input, option?.replace(/["']/g, ''));
              obj[rule] = result;

              const valid = obj.valid && result;
              obj.valid = valid;
              obj.invalid = !valid;
            }
      
            return obj;
          },
          { valid: true, invalid: false }
        );

        if (!isRequired && input === '' && obj.invalid) {
          const valid = true;
          obj.valid = valid;
          obj.invalid = !valid;
        }

        return obj;
      }
    };
  })();

  /**
   * 
   * @param {HTMLFormElement} form 
   */
  function getFormData(form) {
    return form['_x_dataStack'][0];
  }

  /**
   * 
   * @param {HTMLFormElement} form 
   * @param {HTMLInputElement} input 
   */
  const getDataRef = function(form, input) {
    let data = getFormData(form);
    if (!data.errors) {
      throw Error(`Add x-data.errors in form`);
    }

    let lastKey = '';
    data = data.errors;
    const keys = input.name
      .split('.')
      .map(
        e => e
              .split('[')
              .map(e => e.replace(']', ''))
      )
      .reduce((a, c) => [...a, ...c], []);

    lastKey = keys.splice(keys.length-1, 1)[0];

    for (const i in keys) {
      const key = keys[i];
      if (!data[key]) {
        const nextIdx = +i+1;
        if (isNaN(keys[nextIdx])) {
          data[key] = {};
        } else {
          data[key] = [];
        }
      }
      
      data = data[key];
    }

    return [data, lastKey];
  }

  function getRules(expression) {
    return expression.replace(/ /g, '').split(/,/g).map(e => e.split(':'));
  }

  /**
   * form에 설정된 errors data에 validtion object를 수정한다.
   * 첫 입력 전에는 valid는 true 값으로 설정되며 값이 입력 후로 valid 값이 변한다.
   */
  Alpine.directive('rule', function(el, bindding, context) {
    const { expression } = bindding;
    const { effect, cleanup } = context;

    if (!(el instanceof HTMLInputElement)) {
      console.warn(`x-rule must be used with HTMLInputElement.`);
      return; 
    }

    if (!el.name) {
      console.warn(`Name is required.`);
      return;
    }
    
    const form = el.form;
    if (!form) {
      console.warn(`Not found parent form.`);
      return;
    }

    const rules = getRules(expression);

    const input = el;
    const [ data, key ] = getDataRef(form, input);

    let inited = false;
    effect(() => {
      const value = input._x_model.get();
      if (inited) {
        data[key] = validate.check(value, rules);
      } else {
        data[key] = validate.base(value, rules);
        inited = true;
      }
    });

    cleanup(() => {
      delete data[lastKey];

      if (Object.keys(data).length === 0) {
        delete data;
      }
    });
  });

  Alpine.directive('validate', function(el, _, context) {
    // const { expression } = bindding;
    const { effect, evaluateLater, cleanup } = context;

    if (!el.name) {
      console.warn('Name is required.');
      return;
    }

    if (!(el instanceof HTMLFormElement)) {
      console.warn(`x-validate must be used with HTMLFormElement.`);
      return; 
    }

    const submitHandler = function (event) {
      event.preventDefault();
      const form = el;
      let valid = true;
      [...el.querySelectorAll('input')]
        .forEach((input) => {
          const [ data, key ] = getDataRef(form, input);

          const expression = input.getAttribute('x-rule');
          if (expression) {
            const rules = getRules(expression);
            const value = input._x_model.get();
            const obj = validate.check(value, rules);;
            data[key] = obj;
            valid = valid && obj.valid;
          }
        });

      event.valid = valid;
    }
    
    const resetHandler = function (event) {
      console.log('reset', [...el.querySelectorAll('input')]);
    }

    el.addEventListener('submit', submitHandler,);
    el.addEventListener('reset', resetHandler,);
    
    cleanup(() => {
      el.removeEventListener('submit', submitHandler);
      el.removeEventListener('reset', resetHandler);
    })
  });
});