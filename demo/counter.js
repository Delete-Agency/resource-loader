console.log('Counter component is loaded');

class Counter {
    constructor(element) {
        this.element = element;
        console.log('Counter component is created');
    }

    init() {
        this.content = this.element.querySelector('[data-content]');
        this.number = parseInt(this.content.innerText);
        const button = this.element.querySelector('[data-button]');
        button.addEventListener('click', () => {
            this.number++;
            this.content.innerText = this.number;
        })
    }
}