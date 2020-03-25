interface Dog {
  name: string;
  isGoodDog: boolean;
}

interface Other {
  name: string
}

class ArrayParams extends HTMLElement {
  public update(dogs: Dog[]) {
  }

  private thing(x: Other) {
  }
}

customElements.define('devtools-dog-view', ArrayParams);
