import { Entity, EntitySchema } from "../../models";
import React, { useState } from "react";
import { deleteEntity } from "../../models/firestore";
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle
} from "@material-ui/core";
import EntityPreview from "../../core/components/EntityPreview";
import CircularProgressCenter from "../../core/internal/CircularProgressCenter";
import { useCMSAppContext, useSnackbarController } from "../../contexts";


export interface DeleteEntityDialogProps<M extends { [Key: string]: any }> {
    entityOrEntitiesToDelete?: Entity<M> | Entity<M>[],
    collectionPath: string,
    schema: EntitySchema<M>,
    open: boolean;
    onClose: () => void;

    onEntityDelete?(collectionPath: string, entity: Entity<M>): void;

    onMultipleEntitiesDelete?(collectionPath: string, entities: Entity<M>[]): void;
}

export default function DeleteEntityDialog<M extends { [Key: string]: any }>({
                                                                            entityOrEntitiesToDelete,
                                                                            schema,
                                                                            onClose,
                                                                            open,
                                                                            onEntityDelete,
                                                                            onMultipleEntitiesDelete,
                                                                            collectionPath,
                                                                            ...other
                                                                        }
                                                                            : DeleteEntityDialogProps<M>) {

    const snackbarContext = useSnackbarController();
    const [loading, setLoading] = useState(false);

    const entityOrEntitiesRef = React.useRef<Entity<M> | Entity<M>[]>();
    const [multipleEntities, setMultipleEntities] = React.useState<boolean>();
    const context = useCMSAppContext();

    React.useEffect(() => {
        if (entityOrEntitiesToDelete) {
            entityOrEntitiesRef.current = Array.isArray(entityOrEntitiesToDelete) && entityOrEntitiesToDelete.length === 1
                ? entityOrEntitiesToDelete[0]
                : entityOrEntitiesToDelete;
            setMultipleEntities(Array.isArray(entityOrEntitiesRef.current));
        }
    }, [entityOrEntitiesToDelete]);

    const entityOrEntities = entityOrEntitiesRef.current;

    const handleCancel = () => {
        onClose();
    };

    const onDeleteSuccess = (entity: Entity<any>) => {
        console.debug("Deleted", entity);
    };

    const onDeleteFailure = (entity: Entity<any>, e: Error) => {
        snackbarContext.open({
            type: "error",
            title: `${schema.name}: Error deleting`,
            message: e?.message
        });

        console.error("Error deleting entity");
        console.error(e);
    };

    const onPreDeleteHookError = (entity: Entity<any>, e: Error) => {
        snackbarContext.open({
            type: "error",
            title: `${schema.name}: Error before deleting`,
            message: e?.message
        });
        console.error(e);
    };

    const onDeleteSuccessHookError = (entity: Entity<any>, e: Error) => {
        snackbarContext.open({
            type: "error",
            title: `${schema.name}: Error after deleting (entity is deleted)`,
            message: e?.message
        });
        console.error(e);
    };

    function performDelete(entity: Entity<M>): Promise<boolean> {
        return deleteEntity({
            entity,
            schema,
            collectionPath,
            onDeleteSuccess,
            onDeleteFailure,
            onPreDeleteHookError,
            onDeleteSuccessHookError,
            context
        });
    }

    const handleOk = async () => {
        if (entityOrEntities) {

            setLoading(true);

            if (multipleEntities) {
                Promise.all((entityOrEntities as Entity<M>[]).map(performDelete)).then((results) => {

                    setLoading(false);

                    if (onMultipleEntitiesDelete && entityOrEntities)
                        onMultipleEntitiesDelete(collectionPath, entityOrEntities as Entity<M>[]);

                    if (results.every(Boolean)) {
                        snackbarContext.open({
                            type: "success",
                            message: `${schema.name}: multiple deleted`
                        });
                    } else if (results.some(Boolean)) {
                        snackbarContext.open({
                            type: "warning",
                            message: `${schema.name}: Some of the entities have been deleted, but not all`
                        });
                    } else {
                        snackbarContext.open({
                            type: "error",
                            message: `${schema.name}: Error deleting entities`
                        });
                    }
                    onClose();
                });

            } else {
                performDelete(entityOrEntities as Entity<M>).then((success) => {
                    setLoading(false);
                    if (success) {
                        if (onEntityDelete && entityOrEntities)
                            onEntityDelete(collectionPath, entityOrEntities as Entity<M>);
                        snackbarContext.open({
                            type: "success",
                            message: `${schema.name} deleted`
                        });
                        onClose();
                    }
                });
            }
        }
    };

    const content = entityOrEntities && (multipleEntities ?
        <div>Multiple entities</div> :
        <EntityPreview entity={entityOrEntities as Entity<M>}
                       schema={schema}/>);

    const dialogTitle = multipleEntities ? `${schema.name}: Confirm multiple delete?`
        : `Would you like to delete this ${schema.name}?`;

    return (
        <Dialog
            maxWidth="md"
            aria-labelledby="delete-dialog"
            open={open}
            onBackdropClick={onClose}
            {...other}
        >
            <DialogTitle id="delete-dialog-title">
                {dialogTitle}
            </DialogTitle>

            {!multipleEntities && <DialogContent dividers>
                {content}
            </DialogContent>}

            {loading && <CircularProgressCenter/>}

            {!loading &&
            <DialogActions>
                <Button autoFocus onClick={handleCancel}
                        color="primary">
                    Cancel
                </Button>
                <Button onClick={handleOk} color="primary">
                    Ok
                </Button>
            </DialogActions>}

        </Dialog>
    );
}

