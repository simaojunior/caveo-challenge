export type CompensationFn = () => Promise<void>;

export namespace AddCompensation {
  export type Input = CompensationFn;
  export type Output = void;
}

export interface IAddCompensation {
  addCompensation: (input: AddCompensation.Input) => AddCompensation.Output;
}

export namespace Run {
  export type Input<TResult> = () => Promise<TResult>;
  export type Output<TResult> = Promise<TResult>;
}

export interface IRun {
  run: <TResult>(input: Run.Input<TResult>) => Run.Output<TResult>;
}
