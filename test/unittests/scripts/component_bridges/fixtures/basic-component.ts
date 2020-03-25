interface Dog {
  name: string;
  isGoodDog: boolean;
}

class BasicComponent extends HTMLElement {
  public update(dog: Dog) {
  }
}

customElements.define('devtools-dog-view', BasicComponent);
