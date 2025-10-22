import {CellPredicate} from "./cell";

export const isMineCellPredicate: CellPredicate = ({isMine}) => isMine;
export const isNotMineCellPredicate: CellPredicate = ({isMine}) => !isMine;
