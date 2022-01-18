import { ReactElement } from "react";

export type EitherVieProps = {
  predicate: () => boolean;
  left: ReactElement<any, any>;
  right: ReactElement<any, any>;
};

export const EitherView = ({ predicate, left, right }: EitherVieProps) => {
  if (predicate()) {
    return left;
  } else {
    return right;
  }
};
