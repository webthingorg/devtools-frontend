interface Dog {
  name: string;
  isGoodDog: boolean;
}

class MultipleMethods extends HTMLElement {
  public update(dog: Dog) {
  }

  public otherMethod(name: string) {
  }

  private somethingElse() {
  }

  private whoCares(dogs: Dog[]) {
  }
}

customElements.define('devtools-dog-view', MultipleMethods);
