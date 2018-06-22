import { ts, Type as TSType } from 'ts-simple-ast'
export * from 'ts-simple-ast'

export declare class Type<TType extends ts.Type = ts.Type> extends TSType {
  constructor(global: any, type: TType)
}
