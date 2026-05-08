document.documentElement.classList.remove('no-js');
document.documentElement.classList.add('js');

const selectors = {
  menuToggle: '[data-menu-toggle]',
  mobileMenu: '[data-mobile-menu]',
  cartToggle: '[data-cart-toggle]',
  cartDrawer: '[data-cart-drawer]',
  cartClose: '[data-cart-close]',
  quickAdd: '[data-quick-add]',
  productForm: '[data-product-form]',
  productVariants: '[data-product-variants]',
  optionSelect: '[data-option-select]',
  variantInput: '[data-variant-input]',
  productSubmit: '[data-product-submit]'
};

document.addEventListener('click', async (event) => {
  const menuToggle = event.target.closest(selectors.menuToggle);
  if (menuToggle) {
    const menu = document.querySelector(selectors.mobileMenu);
    const isOpen = menu.classList.toggle('is-open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  }

  const cartToggle = event.target.closest(selectors.cartToggle);
  if (cartToggle) {
    event.preventDefault();
    openCartDrawer();
  }

  if (event.target.closest(selectors.cartClose)) {
    closeCartDrawer();
  }

  const quickAdd = event.target.closest(selectors.quickAdd);
  if (quickAdd) {
    event.preventDefault();
    await addVariantToCart(quickAdd);
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeCartDrawer();
});

document.addEventListener('change', (event) => {
  const optionSelect = event.target.closest(selectors.optionSelect);
  if (!optionSelect) return;

  const form = optionSelect.closest(selectors.productForm);
  if (form) updateSelectedVariant(form);
});

document.querySelectorAll(selectors.productForm).forEach(updateSelectedVariant);

async function addVariantToCart(button) {
  const variantId = button.getAttribute('data-variant-id');
  if (!variantId) return;

  button.disabled = true;
  const originalText = button.textContent;
  button.textContent = button.getAttribute('data-adding-label') || 'Adding...';

  try {
    const response = await fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ id: Number(variantId), quantity: 1 })
    });

    if (!response.ok) throw new Error('Cart add failed');
    window.location.href = '/cart';
  } catch (error) {
    button.textContent = button.getAttribute('data-error-label') || 'Try again';
    window.setTimeout(() => {
      button.textContent = originalText;
      button.disabled = false;
    }, 1800);
  }
}

function updateSelectedVariant(form) {
  const variantsScript = form.querySelector(selectors.productVariants);
  const variantInput = form.querySelector(selectors.variantInput);
  const submit = form.querySelector(selectors.productSubmit);
  if (!variantsScript || !variantInput || !submit) return;

  let variants = [];
  try {
    variants = JSON.parse(variantsScript.textContent);
  } catch (error) {
    return;
  }

  const selectedOptions = Array.from(form.querySelectorAll(selectors.optionSelect)).map((select) => select.value);
  const selectedVariant = variants.find((variant) => {
    return variant.options.length === selectedOptions.length
      && variant.options.every((option, index) => option === selectedOptions[index]);
  });

  const addLabel = submit.getAttribute('data-add-label') || submit.textContent;
  const soldOutLabel = submit.getAttribute('data-sold-out-label') || submit.textContent;
  const unavailableLabel = submit.getAttribute('data-unavailable-label') || soldOutLabel;

  if (!selectedVariant) {
    variantInput.value = '';
    submit.disabled = true;
    submit.textContent = unavailableLabel;
    return;
  }

  variantInput.value = String(selectedVariant.id);
  submit.disabled = !selectedVariant.available;
  submit.textContent = selectedVariant.available ? addLabel : soldOutLabel;
}

function openCartDrawer() {
  const drawer = document.querySelector(selectors.cartDrawer);
  if (!drawer) {
    window.location.href = '/cart';
    return;
  }
  drawer.classList.add('is-open');
  drawer.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeCartDrawer() {
  const drawer = document.querySelector(selectors.cartDrawer);
  if (!drawer) return;
  drawer.classList.remove('is-open');
  drawer.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}
