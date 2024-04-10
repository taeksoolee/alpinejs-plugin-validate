# alpinejs-plugin-validate
> 🚀 Alpinejs Simple Validate Plguin

## Getting Started
1. Add script in html
```html
<script defer src="/path/to/alpinejs-plugin-validate.js">
<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
```
2. Write Form, input
```html
<form
  name="myForm"
  x-validate
  x-data="{
    formData: { // required
      a: '',
      b: '',
    },
    errors: { // required
      // The error object is bound here.
    }
  }"
  @submit="(event) => {
    alert(`Result: ${event.valid}`);
  }"
>
  <input name="a" x-model="formData.a" x-rule="required,minSize:3" />
  <p x-text="JSON.stringify(errors.a)"></p>
  <input name="b" x-model="formData.b" x-rule="required" />
  <p x-text="JSON.stringify(errors.b)"></p>

  <button type="submit">Submit</button>
</form>
```

## rules
- required
- email
- phone
- number
- maxSize
- minSize
