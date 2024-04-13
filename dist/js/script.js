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
        thisProduct.initAccordion();
        console.log("new Product:", thisProduct);
    }

    renderInManu() {
        const thisProduct = this;
        /* generate HTML based on tamplate */
        const generatedHTML = templates.menuProduct(thisProduct.data);
        // console.log(generatedHTML)

        /* create element using utils.createElementFromHRML */
        thisProduct.element = utils.createDOMFromHTML(generatedHTML);
        console.log(thisProduct.element);

        /* find menu container */
        const menuContainer = document.querySelector(select.containerOf.menu);
        console.log("manuContainer", menuContainer);

        /* add element to menu */
        menuContainer.appendChild(thisProduct.element);
    }

    initAccordion() {
        const thisProduct = this;
        const clickableTriggers = thisProduct.element.querySelectorAll(
            select.menuProduct.clickable
        );

        for (const clickableTrigger of clickableTriggers) {
            clickableTrigger.addEventListener("click", function (event) {
                event.preventDefault();
                const activeProduct = document.querySelector(
                    select.all.menuProductsActive
                );
                if (activeProduct && activeProduct !== thisProduct.element) {
                    activeProduct.classList.remove(
                        classNames.menuProduct.wrapperActive
                    );
                }
                thisProduct.element.classList.toggle(
                    classNames.menuProduct.wrapperActive
                );
            });
        }
    }
}

const app = {
    initMenu: function () {
        const thisApp = this;
        console.log("thisApp.data", thisApp.data);
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
        console.log("*** App starting ***");
        console.log("thisApp:", thisApp);
        console.log("classNames:", classNames);
        console.log("settings:", settings);
        console.log("templates:", templates);

        thisApp.initData();
        thisApp.initMenu();
    },
};

app.init();
