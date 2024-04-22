/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

('use strict');

const select = {
  templateOf: {
    menuProduct: '#template-menu-product',
    cartProduct: '#template-cart-product'
  },
  containerOf: {
    menu: '#product-list',
    cart: '#cart'
  },
  all: {
    menuProducts: '#product-list > .product',
    menuProductsActive: '#product-list > .product.active',
    formInputs: 'input, select'
  },
  menuProduct: {
    clickable: '.product__header',
    form: '.product__order',
    priceElem: '.product__total-price .price',
    imageWrapper: '.product__images',
    amountWidget: '.widget-amount',
    cartButton: '[href="#add-to-cart"]'
  },
  widgets: {
    amount: {
      input: 'input.amount',
      linkDecrease: 'a[href="#less"]',
      linkIncrease: 'a[href="#more"]'
    }
  },
  cart: {
    productList: '.cart__order-summary',
    toggleTrigger: '.cart__summary',
    totalNumber: `.cart__total-number`,
    totalPrice:
      '.cart__total-price strong, .cart__order-total .cart__order-price-sum strong',
    subtotalPrice: '.cart__order-subtotal .cart__order-price-sum strong',
    deliveryFee: '.cart__order-delivery .cart__order-price-sum strong',
    form: '.cart__order',
    formSubmit: '.cart__order [type="submit"]',
    phone: '[name="phone"]',
    address: '[name="address"]'
  },
  cartProduct: {
    amountWidget: '.widget-amount',
    price: '.cart__product-price',
    edit: '[href="#edit"]',
    remove: '[href="#remove"]'
  }
};

const classNames = {
  menuProduct: {
    wrapperActive: 'active',
    imageVisible: 'active'
  },
  cart: {
    wrapperActive: 'active'
  }
};

const settings = {
  amountWidget: {
    defaultValue: 1,
    defaultMin: 1,
    defaultMax: 9
  },
  cart: {
    defaultDeliveryFee: 20
  },
  db: {
    url: '//localhost:3131',
    products: 'products',
    orders: 'orders'
  }
};

const templates = {
  menuProduct: Handlebars.compile(
    document.querySelector(select.templateOf.menuProduct).innerHTML
  ),
  // CODE ADDED START
  cartProduct: Handlebars.compile(
    document.querySelector(select.templateOf.cartProduct).innerHTML
  )
  // CODE ADDED END
};

class Product {
  constructor(id, data) {
    const thisProduct = this;
    thisProduct.id = id;
    thisProduct.name = data.name;
    thisProduct.amount = data.amount;
    thisProduct.priceSingle = data.price;
    thisProduct.data = data;
    thisProduct.renderInMenu();
    thisProduct.getElements();
    thisProduct.initAccordion();
    thisProduct.initOrderForm();
    thisProduct.initAmountWidget();
    thisProduct.processOrder();
    // console.log("new Product:", thisProduct);
  }

  renderInMenu() {
    const thisProduct = this;
    /* generate HTML based on tamplate */
    const generatedHTML = templates.menuProduct(thisProduct.data);
    // console.log(generatedHTML)

    /* create element using utils.createElementFromHRML */
    thisProduct.element = utils.createDOMFromHTML(generatedHTML);
    // console.log(thisProduct.element);

    /* find menu container */
    const menuContainer = document.querySelector(select.containerOf.menu);
    // console.log("manuContainer", menuContainer);

    /* add element to menu */
    menuContainer.appendChild(thisProduct.element);
  }

  getElements() {
    const thisProduct = this;

    thisProduct.accordionTrigger = thisProduct.element.querySelector(
      select.menuProduct.clickable
    );
    thisProduct.form = thisProduct.element.querySelector(
      select.menuProduct.form
    );
    thisProduct.formInputs = thisProduct.form.querySelectorAll(
      select.all.formInputs
    );
    thisProduct.cartButton = thisProduct.element.querySelector(
      select.menuProduct.cartButton
    );
    thisProduct.priceElem = thisProduct.element.querySelector(
      select.menuProduct.priceElem
    );
    thisProduct.imageWrapper = thisProduct.element.querySelector(
      select.menuProduct.imageWrapper
    );

    thisProduct.amountWidgetElem = thisProduct.element.querySelector(
      select.menuProduct.amountWidget
    );
  }

  initAccordion() {
    const thisProduct = this;
    const clickableTriggers = thisProduct.element.querySelectorAll(
      select.menuProduct.clickable
    );

    for (const clickableTrigger of clickableTriggers) {
      clickableTrigger.addEventListener('click', function (event) {
        event.preventDefault();
        const activeProduct = document.querySelector(
          select.all.menuProductsActive
        );
        if (activeProduct && activeProduct !== thisProduct.element) {
          activeProduct.classList.remove(classNames.menuProduct.wrapperActive);
        }
        thisProduct.element.classList.toggle(
          classNames.menuProduct.wrapperActive
        );
      });
    }
  }
  initOrderForm() {
    const thisProduct = this;
    // console.log("initOrderForm:", thisProduct);
    thisProduct.form.addEventListener('submit', function (event) {
      event.preventDefault();
      thisProduct.processOrder();
    });

    for (let input of thisProduct.formInputs) {
      input.addEventListener('change', function () {
        thisProduct.processOrder();
      });
    }

    thisProduct.cartButton.addEventListener('click', function (event) {
      event.preventDefault();
      thisProduct.processOrder();
      thisProduct.addToCart();
    });
  }
  processOrder() {
    const thisProduct = this;

    // Convert form to object structure e.g. { sauce: ['tomato'], toppings: ['olives', 'redPeppers']}
    const formData = utils.serializeFormToObject(thisProduct.form);

    // Set price to default price
    let price = thisProduct.data.price;

    // For every category (param)...
    for (let paramId in thisProduct.data.params) {
      // Determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... }
      const param = thisProduct.data.params[paramId];

      // For every option in this category
      for (let optionId in param.options) {
        // Determine option value, e.g. optionId = 'olives', option = { label: 'Olives', price: 2, default: true }
        const option = param.options[optionId];

        // Check if option is selected in form data
        const optionSelected =
          formData[paramId] && formData[paramId].includes(optionId);

        // Check if the option is default
        const optionDefault = option.default;

        // If option is selected...
        if (optionSelected && !optionDefault) {
          price += option.price;
        } else if (!optionSelected && optionDefault) {
          price -= option.price;
        }

        const optionImage = thisProduct.imageWrapper.querySelector(
          '.' + paramId + '-' + optionId
        );
        if (optionImage !== null) {
          if (optionSelected) {
            optionImage.classList.add(classNames.menuProduct.imageVisible);
          } else {
            optionImage.classList.remove(classNames.menuProduct.imageVisible);
          }
        }
      }
    }

    // Multiply the price by the quantity from the amount widget
    price *= thisProduct.amountWidget.value;

    // Update the price in the HTML
    thisProduct.priceElem.innerHTML = price;
  }

  initAmountWidget() {
    const thisProduct = this;
    thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem);
    thisProduct.amountWidgetElem.addEventListener('updated', function () {
      thisProduct.processOrder();
    });
  }

  addToCart() {
    const thisProduct = this;
    app.cart.add(thisProduct.prepareCartProduct());
  }
  prepareCartProduct() {
    const thisProduct = this;
    const priceSingle = thisProduct.priceSingle;
    const amount = thisProduct.amountWidget.value;
    const price = priceSingle * amount;
    const productSummary = {
      id: thisProduct.id,
      name: thisProduct.name,
      amount: amount,
      priceSingle: priceSingle,
      price: price,
      params: thisProduct.prepareCartProductParams()
    };
    return productSummary;
  }

  prepareCartProductParams() {
    const thisProduct = this;

    const formData = utils.serializeFormToObject(thisProduct.form);
    const params = {};

    // for very category (param)
    for (let paramId in thisProduct.data.params) {
      const param = thisProduct.data.params[paramId];

      // create category param in params const eg. params = { ingredients: { name: 'Ingredients', options: {}}}
      params[paramId] = {
        label: param.label,
        options: {}
      };

      // for every option in this category
      for (let optionId in param.options) {
        const option = param.options[optionId];
        const optionSelected =
          formData[paramId] && formData[paramId].includes(optionId);

        if (optionSelected) {
          params[paramId].options[optionId] = option.label;
        }
      }
    }
    return params;
  }
}

class AmountWidget {
  constructor(element) {
    const thisWidget = this;
    thisWidget.getElements(element);
    thisWidget.setValue(
      thisWidget.input.value == undefined
        ? settings.amountWidget.defaultValue
        : thisWidget.input.value
    );

    if (!thisWidget.input.hasAttribute('value')) {
      // Jeśli atrybut value nie istnieje, ustawiamy wartość domyślną zdefiniowaną w settings
      thisWidget.setValue(settings.amountWidget.defaultValue);
    }
    thisWidget.initActions();

    // console.log('AmountWidget:', thisWidget);
    // console.log('constructor arguments:', element);
  }

  getElements(element) {
    const thisWidget = this;
    thisWidget.element = element;
    thisWidget.input = thisWidget.element.querySelector(
      select.widgets.amount.input
    );
    thisWidget.linkDecrease = thisWidget.element.querySelector(
      select.widgets.amount.linkDecrease
    );
    thisWidget.linkIncrease = thisWidget.element.querySelector(
      select.widgets.amount.linkIncrease
    );
  }

  setValue(value) {
    const thisWidget = this;
    const newValue = parseInt(value);

    if (
      thisWidget.value !== newValue &&
      !isNaN(newValue) &&
      newValue >= settings.amountWidget.defaultMin &&
      newValue <= settings.amountWidget.defaultMax
    ) {
      thisWidget.value = newValue;
    } else {
      thisWidget.input.value = thisWidget.value;
    }

    thisWidget.input.value = thisWidget.value;
    thisWidget.announce();
  }

  initActions() {
    const thisWidget = this;

    thisWidget.input.addEventListener('change', function () {
      thisWidget.setValue(thisWidget.input.value);
    });
    thisWidget.linkDecrease.addEventListener('click', function () {
      thisWidget.setValue(thisWidget.value - 1);
    });
    thisWidget.linkIncrease.addEventListener('click', function () {
      thisWidget.setValue(thisWidget.value + 1);
    });
    thisWidget.linkIncrease.addEventListener('click', function () {});
  }

  announce() {
    const thisWidget = this;

    const event = new CustomEvent('updated', {
      bubbles: true
    });
    thisWidget.element.dispatchEvent(event);
  }
}

const app = {
  initMenu: function () {
    const thisApp = this;
    // console.log("thisApp.data", thisApp.data);
    for (let productData in thisApp.data.products) {
      new Product(
        thisApp.data.products[productData].id,
        thisApp.data.products[productData]
      );
    }
  },

  initData: function () {
    const thisApp = this;
    const url = settings.db.url + '/' + settings.db.products;
    thisApp.data = {};

    fetch(url)
      .then(function (rawResponse) {
        return rawResponse.json();
      })
      .then(function (parsedResponse) {
        console.log('parsedResponse', parsedResponse);
        thisApp.data.products = parsedResponse; // Zapisanie parsedResponse jako thisApp.data.products
        thisApp.initMenu(); // Wywołanie metody initMenu
      });
    console.log('thisApp.data', JSON.stringify(thisApp.data));
  },

  initCart: function () {
    const thisApp = this;
    const cartElem = document.querySelector(select.containerOf.cart);
    thisApp.cart = new Cart(cartElem);
  },

  init: function () {
    const thisApp = this;
    // console.log("*** App starting ***");
    // console.log("thisApp:", thisApp);
    // console.log("classNames:", classNames);
    // console.log("settings:", settings);
    // console.log("templates:", templates);

    thisApp.initData();
    thisApp.initCart();
  }
};

class Cart {
  constructor(element) {
    const thisCart = this;
    thisCart.products = [];
    thisCart.deliveryFee = settings.cart.defaultDeliveryFee;
    thisCart.getElements(element);
    thisCart.initActions();

    // console.log('new Cart:', thisCart);
  }

  getElements(element) {
    const thisCart = this;
    thisCart.dom = {};
    thisCart.dom.wrapper = element;
    thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(
      select.cart.toggleTrigger
    );
    thisCart.dom.productList = thisCart.dom.wrapper.querySelector(
      select.cart.productList
    );
    thisCart.dom.deliveryFee = thisCart.dom.wrapper.querySelector(
      select.cart.deliveryFee
    );
    thisCart.dom.subtotalPrice = thisCart.dom.wrapper.querySelector(
      select.cart.subtotalPrice
    );
    thisCart.dom.totalPrice = thisCart.dom.wrapper.querySelectorAll(
      select.cart.totalPrice
    );
    thisCart.dom.totalNumber = thisCart.dom.wrapper.querySelector(
      select.cart.totalNumber
    );
    thisCart.dom.form = thisCart.dom.wrapper.querySelector(select.cart.form);
    thisCart.dom.phone = thisCart.dom.wrapper.querySelector(select.cart.phone);
    thisCart.dom.address = thisCart.dom.wrapper.querySelector(
      select.cart.address
    );
  }

  initActions() {
    const thisCart = this;
    thisCart.dom.toggleTrigger.addEventListener('click', function () {
      thisCart.dom.wrapper.classList.toggle(classNames.cart.wrapperActive);
    });

    thisCart.dom.form.addEventListener('submit', function (event) {
      // Zablokuj domyślne zachowanie formularza (przeładowanie strony)
      event.preventDefault();
      // Wywołaj metodę sendOrder
      thisCart.sendOrder();
    });

    // Dodajemy nasłuchiwanie na zdarzenie 'updated' na liście produktów
    thisCart.dom.productList.addEventListener('updated', function () {
      thisCart.update();
    });
  }

  add(menuProduct) {
    const thisCart = this;
    const generatedHTML = templates.cartProduct(menuProduct);

    /* create element using utils.createElementFromHTML */
    const generatedDOM = utils.createDOMFromHTML(generatedHTML);

    /* add element to cart */
    thisCart.dom.productList.appendChild(generatedDOM);
    // console.log('adding product', menuProduct);

    thisCart.products.push(new CartProduct(menuProduct, generatedDOM));
    // console.log('thisCart.products', thisCart.products);
    thisCart.update();
  }
  update() {
    const thisCart = this;
    thisCart.totalNumber = 0;
    thisCart.subtotalPrice = 0;

    for (const product of thisCart.products) {
      thisCart.totalNumber += product.amount;
      thisCart.subtotalPrice += product.price;
    }

    // Add totalNumber and subtotalPrice as properties of Cart object
    thisCart.totalPrice = thisCart.subtotalPrice + thisCart.deliveryFee;

    thisCart.dom.totalNumber.innerHTML = thisCart.totalNumber;
    thisCart.dom.subtotalPrice.innerHTML = thisCart.subtotalPrice;
    thisCart.dom.deliveryFee.textContent = thisCart.deliveryFee;

    for (const totalPriceElement of thisCart.dom.totalPrice) {
      totalPriceElement.innerHTML = thisCart.totalPrice;
    }
  }
  sendOrder() {
    const thisCart = this;
    const url = settings.db.url + '/' + settings.db.orders;

    // Prepare payload object
    const payload = {
      address: thisCart.dom.address.value,
      phone: thisCart.dom.phone.value,
      totalPrice: thisCart.totalPrice,
      subtotalPrice: thisCart.subtotalPrice,
      totalNumber: thisCart.totalNumber,
      deliveryFee: thisCart.deliveryFee,
      products: [] // Empty array for now
    };

    // Add products data to payload
    for (let prod of thisCart.products) {
      payload.products.push(prod.getData());
    }

    // Configure fetch options
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    };

    // Send order data to server
    fetch(url, options)
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        throw new Error('Network response was not ok.');
      })
      .then((data) => {
        console.log('Order sent successfully:', data);
        // Optionally, reset the cart after successful order
        thisCart.clearCart();
      })
      .catch((error) => {
        console.error('There was a problem sending the order:', error.message);
      });
  }
  clearCart() {
    this.products = [];
    this.update();
  }
}

class CartProduct {
  constructor(menuProduct, element) {
    const thisCartProduct = this;
    thisCartProduct.id = menuProduct.id;
    thisCartProduct.name = menuProduct.name;
    thisCartProduct.amount = menuProduct.amount;
    thisCartProduct.priceSingle = menuProduct.priceSingle;
    thisCartProduct.params = menuProduct.params;

    thisCartProduct.getElements(element);
    thisCartProduct.initAmountWidget();

    // Initialize price
    thisCartProduct.price =
      thisCartProduct.priceSingle * thisCartProduct.amount;

    // console.log(thisCartProduct);
  }

  getElements(element) {
    const thisCartProduct = this;
    thisCartProduct.dom = {};
    thisCartProduct.dom.wrapper = element;
    thisCartProduct.dom.amountWidget = element.querySelector(
      select.cartProduct.amountWidget
    );
    thisCartProduct.dom.price = element.querySelector(select.cartProduct.price);
    thisCartProduct.dom.edit = element.querySelector(select.cartProduct.edit);
    thisCartProduct.dom.remove = element.querySelector(
      select.cartProduct.remove
    );
  }
  initAmountWidget() {
    const thisCartProduct = this;

    thisCartProduct.amountWidget = new AmountWidget(
      thisCartProduct.dom.amountWidget
    );

    thisCartProduct.dom.amountWidget.addEventListener('updated', function () {
      thisCartProduct.amount = thisCartProduct.amountWidget.value; // Update the quantity
      thisCartProduct.price =
        thisCartProduct.priceSingle * thisCartProduct.amount; // Recalculate the price
      thisCartProduct.dom.price.innerHTML = thisCartProduct.price; // Update the price in HTML
    });
  }
  getData() {
    const thisCartProduct = this;
    return {
      id: thisCartProduct.id,
      amount: thisCartProduct.amount,
      price: thisCartProduct.price,
      priceSingle: thisCartProduct.priceSingle,
      name: thisCartProduct.name,
      params: thisCartProduct.params
    };
  }
}

app.init();
