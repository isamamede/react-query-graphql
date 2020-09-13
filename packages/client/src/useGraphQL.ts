import { DocumentNode } from "graphql";
import { useContext } from "react";
import { GraphQLContext } from "./context";
import { IMiddleware } from "./graphql-fetch";

interface IFetchGraphQL<TData, TVariables> {
  (
    query: string | DocumentNode,
    variables?: TVariables,
    fetchMiddleware?: IMiddleware[],
  ): Promise<TData>;
}

export function useGraphQL<TData, TVariables>() {
  return (useContext(GraphQLContext) as unknown) as IFetchGraphQL<
    TData,
    TVariables
  >;
}
