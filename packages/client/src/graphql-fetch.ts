import { DocumentNode } from "graphql";
import { print } from "graphql/language/printer";
import "isomorphic-unfetch";

export type Variables = { [key: string]: any };

export interface IHeaders {
  [key: string]: string;
}

export interface IOptions {
  method?: RequestInit["method"];
  headers?: IHeaders;
  mode?: RequestInit["mode"];
  credentials?: RequestInit["credentials"];
  cache?: RequestInit["cache"];
  redirect?: RequestInit["redirect"];
  referrer?: RequestInit["referrer"];
  referrerPolicy?: RequestInit["referrerPolicy"];
  integrity?: RequestInit["integrity"];
}

export interface IGraphQLError {
  message: string;
  locations: { line: number; column: number }[];
  path: string[];
}

export interface IGraphQLResponse {
  data?: any;
  errors?: IGraphQLError[];
  extensions?: any;
  status: number;
  [key: string]: any;
}

export interface IGraphQLRequestContext {
  query: string;
  variables?: Variables;
}

export class ClientError extends Error {
  response: IGraphQLResponse;
  request: IGraphQLRequestContext;

  constructor(response: IGraphQLResponse, request: IGraphQLRequestContext) {
    const message = ClientError.extractMessage(response);
    super(message);
    this.response = response;
    this.request = request;

    // this is needed as Safari doesn't support .captureStackTrace
    if (typeof (Error as any).captureStackTrace === "function") {
      (Error as any).captureStackTrace(this, ClientError);
    }
  }

  private static extractMessage(response: IGraphQLResponse): string {
    try {
      return response.errors![0].message;
    } catch (e) {
      return `GraphQL Error (Code: ${response.status})`;
    }
  }
}

// eslint-disable-next-line @typescript-eslint/ban-types
async function baseFetchGraphQL<Data extends any, Vars extends object>(
  uri: string,
  query: string | DocumentNode,
  variables?: Vars,
  options: IOptions = {},
): Promise<Data> {
  const { headers, ...others } = options;
  const printedQuery = typeof query === "string" ? query : print(query);
  const body = JSON.stringify({
    query: printedQuery,
    variables: variables ? variables : undefined,
  });

  console.log(body);

  try {
    const response = await fetch(uri, {
      method: "POST",
      headers: Object.assign({ "Content-Type": "application/json" }, headers),
      body,
      ...others,
    });

    const contentType = response.headers.get("Content-Type");
    const result = await (contentType &&
    contentType.startsWith("application/json")
      ? response.json()
      : response.text());
    if (response.ok && !result.errors && result.data) {
      return result.data;
    } else {
      const errorResult =
        typeof result === "string" ? { error: result } : result;
      throw new ClientError(
        { ...errorResult, status: response.status },
        { query: printedQuery, variables },
      );
    }
  } catch (e) {
    if (e instanceof ClientError) {
      throw e;
    } else {
      throw new ClientError(
        { ...e, status: "400" },
        { query: printedQuery, variables },
      );
    }
  }
}

export interface IMiddleware {
  (fetch: typeof fetchGraphQL): typeof fetchGraphQL;
}

export const applyMiddleware = (
  baseFetch: typeof fetchGraphQL,
  middlewares: IMiddleware[],
) => {
  return middlewares.reduce((fetch, middleware) => {
    return middleware(fetch);
  }, baseFetch);
};

// eslint-disable-next-line @typescript-eslint/ban-types
export async function fetchGraphQL<Data extends any, Vars extends object>(
  uri: string,
  query: string | DocumentNode,
  variables?: Vars,
  {
    middleware = [],
    ...options
  }: IOptions & { middleware?: IMiddleware[] } = {},
): Promise<Data> {
  return await applyMiddleware(baseFetchGraphQL, middleware)(
    uri,
    query,
    variables,
    options,
  );
}
