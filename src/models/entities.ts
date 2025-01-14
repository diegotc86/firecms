import React from "react";
import firebase from "firebase/app";
import "firebase/firestore";
import { CMSAppContext } from "../contexts/CMSAppContext";
import { EnumValues, PropertiesOrBuilder } from "./properties";

/**
 * Specification for defining an entity
 * @category Entities
 */
export interface EntitySchema<M extends { [Key: string]: any }> {

    /**
     * Singular name of the entity as displayed in an Add button . E.g. Product
     */
    name: string;

    /**
     * Description of this entity
     */
    description?: string;

    /**
     * If this property is not set Firestore will create a random ID.
     * You can set the value to true to allow the users to choose the ID.
     * You can also pass a set of values (as an EnumValues object) to allow them
     * to pick from only those
     */
    customId?: boolean | EnumValues;

    /**
     * Set of properties that compose an entity
     */
    properties: PropertiesOrBuilder<M>;

    /**
     * When creating a new entity, set some values as already initialized
     */
    defaultValues?: any;

    /**
     * Hook called when save is successful
     * @param entitySaveProps
     */
    onSaveSuccess?(entitySaveProps: EntitySaveProps<M>)
        : Promise<void> | void;

    /**
     * Hook called when saving fails
     * @param entitySaveProps
     */
    onSaveFailure?(entitySaveProps: EntitySaveProps<M>)
        : Promise<void> | void;

    /**
     * Hook called before saving, you need to return the values that will get
     * saved. If you throw an error in this method the process stops, and an
     * error snackbar gets displayed.
     * @param entitySaveProps
     */
    onPreSave?(entitySaveProps: EntitySaveProps<M>)
        : Promise<EntityValues<M>> | EntityValues<M>

    /**
     * Hook called after the entity is deleted in Firestore.
     * If you throw an error in this method the process stops, and an
     * error snackbar gets displayed.
     *
     * @param entityDeleteProps
     */
    onPreDelete?(entityDeleteProps: EntityDeleteProps<M>): void;

    /**
     * Hook called after the entity is deleted in Firestore.
     *
     * @param entityDeleteProps
     */
    onDelete?(entityDeleteProps: EntityDeleteProps<M>): void;

    /**
     * Array of builders for rendering additional panels in an entity view.
     * Useful if you need to render custom views
     */
    views?: EntityCustomView<M>[];
}

export type InferSchemaType<S extends EntitySchema<any>> = S extends EntitySchema<infer M> ? M : never;

/**
 * You can use this builder to render a custom panel in the entity detail view.
 * It gets rendered as a tab.
 * @category Entities
 */
export type EntityCustomView<M = any> =
    {
        path: string,
        name: string,
        builder: (extraActionsParams: EntityCustomViewParams<M>) => React.ReactNode
    }

/**
 * Parameters passed to the builder in charge of rendering a custom panel for
 * an entity view.
 * @category Entities
 */
export type EntityCustomViewParams<M extends { [Key: string]: any } = any> = {
    /**
     * Schema used by this entity
     */
    schema: EntitySchema<M extends EntitySchema<any> ? InferSchemaType<M> : M>;
    /**
     * Entity that this view refers to. It can be undefined if the entity is new
     */
    entity?: Entity<M extends EntitySchema<any> ? InferSchemaType<M> : M>;

    /**
     * Modified values in the form that have not been saved yet.
     * If the entity is not new and the values are not modified, this values
     * are the same as in `entity`
     */
    modifiedValues?: EntityValues<M>;
};

/**
 * Parameters passed to hooks when an entity is saved
 * @category Entities
 */
export interface EntitySaveProps<M extends { [Key: string]: any }> {

    /**
     * Resolved schema of the entity
     */
    schema: EntitySchema<M>;

    /**
     * Full path where this entity is being saved
     */
    collectionPath: string;

    /**
     * Id of the entity or undefined if new
     */
    id?: string;

    /**
     * Values being saved
     */
    values: EntityValues<M>;

    /**
     * New or existing entity
     */
    status: EntityStatus;

    /**
     * Context of the app status
     */
    context: CMSAppContext;
}

/**
 * Parameters passed to hooks when an entity is deleted
 * @category Entities
 */
export interface EntityDeleteProps<M extends { [Key: string]: any }> {

    /**
     * Schema of the entity being deleted
     */
    schema: EntitySchema<M>;

    /**
     * Firestore path of the parent collection
     */
    collectionPath: string;

    /**
     * Deleted entity id
     */
    id: string;

    /**
     * Deleted entity
     */
    entity: Entity<M>;

    /**
     * Context of the app status
     */
    context: CMSAppContext;
}


/**
 * New or existing status
 * @category Entities
 */
export type EntityStatus = "new" | "existing" | "copy";

/**
 * Representation of an entity fetched from Firestore
 * @category Entities
 */
export interface Entity<M extends { [Key: string]: any }> {
    id: string;
    reference: firebase.firestore.DocumentReference;
    values: EntityValues<M>;
}


/**
 * This type represents a record of key value pairs as described in an
 * entity schema.
 * @category Entities
 */
export type EntityValues<M> = M;

