import ApiDataFetcher from "@/components/ApiDataFetcher/ApiDataFetcher"
import SinglePageLayout from "@/components/SinglePageLayout"
import { Button } from "@/components/ui/button/button"
import { Card, CardContent } from "@/components/ui/card"
import { DeleteConfirmationDialog } from "@/components/ui/DeleteConfirmationDialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import useGlobalVariablesApi, { GlobalVariable, GlobalVariableCreateDTO } from "@/hooks/apiClients/useGlobalVariablesApi"
import useProjectStore from "@/store/useProjectStore"
import useToastNotificationStore from "@/store/useToastNotificationStore"
import EnvironmentsGate from "@/theme/EnvironmentsGate"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { CirclePlus, Pencil, PlusCircle, Trash2 } from "lucide-react"
import React, { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import { EnvironmentVariableDialog } from "./EnvironmentVariableDialog"

// EnvironmentVariableDialog has been moved to a separate file

const EnvironmentVariablesPageInner: React.FC = () => {
    const { t } = useTranslation()
    const globalVariablesApi = useGlobalVariablesApi()
    const queryClient = useQueryClient()
    const { project, environments = [] } = useProjectStore()
    const { showSuccessNotification } = useToastNotificationStore()

    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [initialValues, setEditingVar] = useState<GlobalVariableCreateDTO>(undefined)
    const [variableToDelete, setVariableToDelete] = useState<string | null>(null)

    // Transform API data to group variables by key
    const transformVariables = useCallback(
        (data: GlobalVariable[]): Record<string, GlobalVariableCreateDTO> => {
            const grouped: Record<string, GlobalVariableCreateDTO> = {}

            data.forEach(variable => {
                if (!grouped[variable.key]) {
                    grouped[variable.key] = {
                        key: variable.key,
                        values: []
                    }
                }

                if (environments?.find(e => e._id === variable.environmentId)) {
                    grouped[variable.key].values.push({
                        environmentId: variable.environmentId,
                        value: variable.value
                    })
                }
            })

            return grouped
        },
        [environments]
    )

    // Fetch variables
    const variablesQuery = useQuery({
        queryKey: ["global-variables", project?._id],
        queryFn: () => globalVariablesApi.getGlobalVariablesByProjectId(project?._id || ""),
        enabled: !!project?._id,
        select: transformVariables
    })

    const variables = variablesQuery.data || {}

    const deleteVariable = useCallback(
        async (key: string) => {
            try {
                await globalVariablesApi.deleteSingle(key)
                showSuccessNotification({
                    message: t("environmentVariables.deleted_success")
                })
                await queryClient.invalidateQueries({ queryKey: ["global-variables", project._id] })
            } catch (error) {
                // Error is handled by the API client
            }
        },
        [project?._id, queryClient, showSuccessNotification, globalVariablesApi, t]
    )

    const handleDeleteClick = (key: string) => {
        setVariableToDelete(key)
    }

    const handleConfirmDelete = async () => {
        if (variableToDelete) {
            await deleteVariable(variableToDelete)
            setVariableToDelete(null)
        }
    }

    const handleEdit = useCallback(
        (variable: GlobalVariableCreateDTO) => {
            setEditingVar({
                ...variable,
                values: environments.map(env => {
                    const existingValue = variable.values.find(v => v.environmentId === env._id)
                    return {
                        environmentId: env._id,
                        value: existingValue?.value
                    }
                })
            })
            setIsDialogOpen(true)
        },
        [environments]
    )

    const handleAddNew = useCallback(() => {
        setEditingVar({
            key: "",
            values: environments.map(env => ({
                environmentId: env._id,
                value: ""
            }))
        })
        setIsDialogOpen(true)
    }, [environments])

    const onSubmitSuccess = () => {
        setIsDialogOpen(false)
        queryClient.invalidateQueries({ queryKey: ["global-variables", project._id] })
        setEditingVar(null)
    }

    return (
        <ApiDataFetcher queries={[variablesQuery]}>
            <SinglePageLayout
                title={t("environmentVariables.title")}
                right={
                    variables && Object.keys(variables).length !== 0 ? (
                        <Button onClick={handleAddNew}>
                            <CirclePlus />
                            {t("environmentVariables.addVariable")}
                        </Button>
                    ) : null
                }
            >
                <Card>
                    <CardContent className="p-0">
                        {!variables || Object.keys(variables).length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-8 text-center">
                                <p className="text-muted-foreground mb-4">{t("environmentVariables.noVariables")}</p>
                                <Button onClick={handleAddNew}>
                                    <CirclePlus />
                                    {t("environmentVariables.addVariable")}
                                </Button>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-64">{t("environmentVariables.variable")}</TableHead>
                                        {environments.map(env => (
                                            <TableHead key={env.slug} className="text-center">
                                                {env.name}
                                            </TableHead>
                                        ))}
                                        <TableHead className="w-32">{t("common.actions")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {Object.keys(variables).map(variableKey => {
                                        const variable = variables[variableKey]
                                        return (
                                            <TableRow key={variable.key}>
                                                <TableCell className="font-mono">{variableKey}</TableCell>
                                                {environments.map(env => {
                                                    const value = variables[variableKey].values.find(v => v.environmentId === env._id)
                                                    const valueKey = `${variable.key}-${env.slug}`

                                                    return (
                                                        <TableCell key={env.slug} className="text-center">
                                                            {value ? (
                                                                <div className="flex items-center justify-center space-x-2">
                                                                    <span className="font-mono">{value.value}</span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-muted-foreground">-</span>
                                                            )}
                                                        </TableCell>
                                                    )
                                                })}
                                                <TableCell className="w-32">
                                                    <div className="flex gap-1">
                                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(variable)} title={t("common.edit")}>
                                                            <Pencil />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleDeleteClick(variable.key)}
                                                            className="text-destructive hover:bg-destructive/15 hover:text-destructive-active"
                                                            title={t("common.delete")}
                                                        >
                                                            <Trash2 />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </SinglePageLayout>
            <DeleteConfirmationDialog
                isOpen={!!variableToDelete}
                onOpenChange={open => !open && setVariableToDelete(null)}
                onDelete={handleConfirmDelete}
                title={t("environmentVariables.deleteVariable")}
                description={t("environmentVariables.deleteConfirmation", { key: variableToDelete })}
            />
            <EnvironmentVariableDialog isOpen={isDialogOpen} onOpenChange={setIsDialogOpen} initialValues={initialValues} environments={environments} onSubmitSuccess={onSubmitSuccess} />
        </ApiDataFetcher>
    )
}

const EnvironmentVariablesPage = () => {
    return (
        <EnvironmentsGate>
            <EnvironmentVariablesPageInner />
        </EnvironmentsGate>
    )
}

export default EnvironmentVariablesPage
