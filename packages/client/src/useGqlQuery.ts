/* eslint-disable @typescript-eslint/ban-types */
import { DocumentNode } from "graphql";
import { QueryConfig, QueryResult, useQuery } from "react-query";
import { getDocKey } from "./getDocKey";
import { ClientError, IMiddleware } from "./graphql-fetch";
import { useGraphQL } from "./useGraphQL";

interface IGraphQLVariables<TVariables> {
  variables?: TVariables;
}

export interface IUseQueryOptions<TData, TVariables, TError = ClientError>
  extends QueryConfig<TData, TError>,
    IGraphQLVariables<TVariables> {
  middleware?: IMiddleware[];
  skip?: boolean;
  opName?: string;
}

export interface IUseQueryResult<TData, TError = ClientError>
  extends QueryResult<TData, TError> {
  loading?: boolean;
}

export function useGqlQuery<
  TData,
  TVariables extends object,
  TError = ClientError
>(
  query: string | DocumentNode,
  {
    variables = {} as TVariables,
    middleware = [],
    opName = typeof query === "string" ? query : getDocKey(query),
    skip = false, // to lazily evaluate query
    ...options
  }: IUseQueryOptions<TData, TVariables, TError> = {},
): IUseQueryResult<TData, TError> {
  const fetchGraphQL = useGraphQL<TData, TVariables>();
  const key: any = [opName, ...(skip ? [false] : [{ variables }])];
  const { status, ...queryObject } = useQuery<TData, TError>(
    key,
    (async (queryKey: string, { variables }: IGraphQLVariables<TVariables>) => {
      return await fetchGraphQL(query, variables, middleware);
    }) as any,
    {
      ...options,
    } as QueryConfig<TData, TError>,
  );

  return {
    loading: status === "loading",
    status,
    ...queryObject,
  };
}
