/// <reference types="react" />
import { ComponentClass, StatelessComponent } from 'react';
import { MutationQueryReducersMap, ApolloQueryResult, ApolloError } from 'apollo-client';
import { FetchMoreOptions, UpdateQueryOptions } from 'apollo-client/core/ObservableQuery';
import { FetchMoreQueryOptions, SubscribeToMoreOptions } from 'apollo-client/core/watchQueryOptions';
import { DocumentNode } from 'graphql';
export interface MutationOptions {
    variables?: Object;
    optimisticResponse?: Object;
    updateQueries?: MutationQueryReducersMap;
    forceFetch?: boolean;
}
export interface QueryOptions {
    ssr?: boolean;
    variables?: {
        [key: string]: any;
    };
    forceFetch?: boolean;
    returnPartialData?: boolean;
    noFetch?: boolean;
    pollInterval?: number;
    skip?: boolean;
}
export interface GraphQLDataProps {
    error?: ApolloError;
    networkStatus: number;
    loading: boolean;
    variables: {
        [variable: string]: any;
    };
    fetchMore: (fetchMoreOptions: FetchMoreQueryOptions & FetchMoreOptions) => Promise<ApolloQueryResult<any>>;
    refetch: (variables?: any) => Promise<ApolloQueryResult<any>>;
    startPolling: (pollInterval: number) => void;
    stopPolling: () => void;
    subscribeToMore: (options: SubscribeToMoreOptions) => () => void;
    updateQuery: (mapFn: (previousQueryResult: any, options: UpdateQueryOptions) => any) => void;
}
export interface InjectedGraphQLProps<T> {
    data?: T & GraphQLDataProps;
}
export declare function withApollo(WrappedComponent: any, operationOptions?: OperationOption): any;
export interface OperationOption {
    options?: Object | ((props: any) => QueryOptions | MutationOptions);
    props?: (props: any) => any;
    skip?: boolean | ((props: any) => boolean);
    name?: string;
    withRef?: boolean;
    shouldResubscribe?: (props: any, nextProps: any) => boolean;
    alias?: string;
}
export interface WrapWithApollo {
    <P, TComponentConstruct extends (ComponentClass<P> | StatelessComponent<P>)>(component: TComponentConstruct): TComponentConstruct;
}
export default function graphql(document: DocumentNode, operationOptions?: OperationOption): WrapWithApollo;
