/* eslint-disable @typescript-eslint/ban-types */
import { DocumentNode } from "graphql";
import {
  MutateFunction,
  MutationConfig,
  MutationResult,
  useMutation,
} from "react-query";
import { getDocKey } from "./getDocKey";
import { ClientError, IMiddleware } from "./graphql-fetch";
import { useGraphQL } from "./useGraphQL";

export interface IUseMutationOptions<TData, TVariables, TError = ClientError>
  extends MutationConfig<TData, TError, TVariables> {
  middleware?: IMiddleware[];
  opName?: string;
}

export interface IUseMutationResult<TData, TError = ClientError>
  extends MutationResult<TData, TError> {
  loading?: boolean;
}

export function useGraphQLMutation<
  TData,
  TVariables extends object,
  TError = ClientError
>(
  mutation: string | DocumentNode,
  {
    middleware = [],
    opName: _ = typeof mutation === "string" ? mutation : getDocKey(mutation),
    ...options
  }: IUseMutationOptions<TData, TVariables, TError> = {},
): [
  MutateFunction<TData, TError, TVariables>,
  IUseMutationResult<TData, TError>,
] {
  const fetchGraphQL = useGraphQL<TData, TVariables>();
  const [mutate, { status, ...mutationObject }] = useMutation<
    TData,
    TError,
    TVariables
  >(async (variables: any) => {
    return await fetchGraphQL(mutation, variables, middleware);
  }, options);

  return [
    mutate,
    {
      loading: status === "loading",
      status,
      ...mutationObject,
    },
  ];
}
