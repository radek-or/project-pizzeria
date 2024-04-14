/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

("use strict");

const select = {
	templateOf: {
		menuProduct: "#template-menu-product",
	},
	containerOf: {
		menu: "#product-list",
		cart: "#cart",
	},
	all: {
		menuProducts: "#product-list > .product",
		menuProductsActive: "#product-list > .product.active",
		formInputs: "input, select",
	},
	menuProduct: {
		clickable: ".product__header",
		form: ".product__order",
		priceElem: ".product__total-price .price",
		imageWrapper: ".product__images",
		amountWidget: ".widget-amount",
		cartButton: '[href="#add-to-cart"]',
	},
	widgets: {
		amount: {
			input: 'input[name="amount"]',
			linkDecrease: 'a[href="#less"]',
			linkIncrease: 'a[href="#more"]',
		},
	},
};

const classNames = {
	menuProduct: {
		wrapperActive: "active",
		imageVisible: "active",
	},
};

const settings = {
	amountWidget: {
		defaultValue: 1,
		defaultMin: 0,
		defaultMax: 10,
	},
};

const templates = {
	menuProduct: Handlebars.compile(
		document.querySelector(select.templateOf.menuProduct).innerHTML
	),
};

class Product {
	constructor(id, data) {
		const thisProduct = this;
		thisProduct.id = id;
		thisProduct.data = data;
		thisProduct.renderInManu();
		thisProduct.getElements();
		thisProduct.initAccordion();
		thisProduct.initOrderForm();
		thisProduct.processOrder();
		// console.log("new Product:", thisProduct);
	}

	renderInManu() {
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
		thisProduct.form = thisProduct.element.querySelector(select.menuProduct.form);
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
	}

	initAccordion() {
		const thisProduct = this;
		const clickableTriggers = thisProduct.element.querySelectorAll(
			select.menuProduct.clickable
		);

		for (const clickableTrigger of clickableTriggers) {
			clickableTrigger.addEventListener("click", function (event) {
				event.preventDefault();
				const activeProduct = document.querySelector(select.all.menuProductsActive);
				if (activeProduct && activeProduct !== thisProduct.element) {
					activeProduct.classList.remove(classNames.menuProduct.wrapperActive);
				}
				thisProduct.element.classList.toggle(classNames.menuProduct.wrapperActive);
			});
		}
	}
	initOrderForm() {
		const thisProduct = this;
		// console.log("initOrderForm:", thisProduct);
		thisProduct.form.addEventListener("submit", function (event) {
			event.preventDefault();
			thisProduct.processOrder();
		});

		for (let input of thisProduct.formInputs) {
			input.addEventListener("change", function () {
				thisProduct.processOrder();
			});
		}

		thisProduct.cartButton.addEventListener("click", function (event) {
			event.preventDefault();
			thisProduct.processOrder();
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
					"." + paramId + "-" + optionId
				);
				console.log(optionImage);
				if (optionImage !== null) {
					if (optionSelected) {
						optionImage.classList.add(classNames.menuProduct.imageVisible);
					} else {
						optionImage.classList.remove(classNames.menuProduct.imageVisible);
					}
				}
			}
		}

		// Update calculated price in the HTML
		thisProduct.priceElem.innerHTML = price;
	}
}

const app = {
	initMenu: function () {
		const thisApp = this;
		// console.log("thisApp.data", thisApp.data);
		for (let productData in thisApp.data.products) {
			new Product(productData, thisApp.data.products[productData]);
		}
	},

	initData: function () {
		const thisApp = this;

		thisApp.data = dataSource;
	},

	init: function () {
		const thisApp = this;
		// console.log("*** App starting ***");
		// console.log("thisApp:", thisApp);
		// console.log("classNames:", classNames);
		// console.log("settings:", settings);
		// console.log("templates:", templates);

		thisApp.initData();
		thisApp.initMenu();
	},
};

app.init();
