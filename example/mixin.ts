type Constructor<T> = {
  new (...args: any[]): T;
  prototype: T;
};

interface IPreparedMixin {
  shaken: boolean;
}

export function Prepared<TBase extends Constructor<any>>(
  Base: TBase,
): TBase & Constructor<IPreparedMixin> {
  return class PreparedMixin extends Base implements IPreparedMixin {
    // this is part of the exports surface and must be annotated
    shaken = true;
  };
}

export class Drink {
  proof: number;

  constructor(proof: number) {
    this.proof = proof;
  }
}

// Instead of trying to extract this line as a transformation, just require users to write it.
const PreparedDrink: typeof Drink & Constructor<IPreparedMixin> = Prepared(Drink);
// This simpler syntax will eventually be possible too:
// const PreparedDrink: Prepared<Drink> = Prepared(Drink);
export class Margherita extends PreparedDrink {
  lime = true;
  salt = false;
}

const marg = new Margherita(60);

marg.proof;
marg.lime;
marg.salt;
marg.shaken;
