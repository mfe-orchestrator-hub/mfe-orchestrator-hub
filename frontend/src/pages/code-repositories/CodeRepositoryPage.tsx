import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button/button"
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DeleteConfirmationDialog } from '@/components/ui/DeleteConfirmationDialog';
import { Plus, Trash2, GitBranch, Edit, Star } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ApiDataFetcher from '@/components/ApiDataFetcher/ApiDataFetcher';
import useProjectStore from '@/store/useProjectStore';
import SinglePageLayout from '@/components/SinglePageLayout';
import { Badge } from "@/components/ui/badge/badge"
import AddRepositoryDialog from './AddRepositoryDialog';
import useCodeRepositoriesApi, { CodeRepositoryProvider } from '@/hooks/apiClients/useCodeRepositoriesApi';
import { useNavigate } from 'react-router-dom';

const CodeRepositoryPage = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const project = useProjectStore();
  const codeRepositoriesApi = useCodeRepositoriesApi();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [repositoryToDelete, setRepositoryToDelete] = useState<{ id: string, name: string } | null>(null);
  const [repositoryToEdit, setRepositoryToEdit] = useState<any | null>(null);
  const navigate = useNavigate();

  // Mock data query - replace with actual API call
  const repositoriesQuery = useQuery({
    queryKey: ['code-repositories', project.project?._id],
    queryFn: () => codeRepositoriesApi.getRepositoriesByProjectId(project.project?._id)
  });

  // Mock delete mutation - replace with actual API call
  const deleteRepositoryMutation = useMutation({
    mutationFn: async (id: string) => codeRepositoriesApi.deleteSingle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['code-repositories', project.project?._id] });
    },
  });

  // Set repository as default mutation
  const setDefaultMutation = useMutation({
    mutationFn: async (repositoryId: string) => codeRepositoriesApi.setRepositoryAsDefault(repositoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['code-repositories', project.project?._id] });
    },
  });

  const getProviderColor = (provider: CodeRepositoryProvider) => {
    switch (provider) {
      case CodeRepositoryProvider.GITHUB: return 'bg-gray-100 text-gray-800';
      case CodeRepositoryProvider.GITLAB: return 'bg-blue-100 text-blue-800';
      case CodeRepositoryProvider.AZURE_DEV_OPS: return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <ApiDataFetcher queries={[repositoriesQuery]}>
      <SinglePageLayout
        title={t('codeRepositories.title')}
        description={t('codeRepositories.description')}
        right={repositoriesQuery.data?.length === 0 ? null :
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t('codeRepositories.addRepository')}
          </Button>
        }
      >
        <Card>
          <CardContent>
            {repositoriesQuery.data?.length === 0 ?
              <div className="flex flex-col items-center justify-center h-full">
                <div className="text-center py-8 text-muted-foreground">
                  {t('codeRepositories.noRepositoriesFound')}
                </div>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('codeRepositories.addRepository')}
                </Button>
              </div>
              :
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('codeRepositories.columns.name')}</TableHead>
                    <TableHead>{t('codeRepositories.columns.provider')}</TableHead>
                    <TableHead>Default</TableHead>
                    <TableHead className="text-right">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {repositoriesQuery.data?.map((repository) => (
                    <TableRow key={repository._id}>
                      <TableCell className="font-medium">{repository.name}</TableCell>
                      <TableCell>
                        <Badge className={getProviderColor(repository.provider)}>
                          {repository.provider}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={setDefaultMutation.isPending}
                          onClick={() => setDefaultMutation.mutate(repository._id)}
                          className="h-8 w-8"
                        >
                          <Star
                            className={`h-4 w-4 ${
                              repository.default
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300 hover:text-yellow-400'
                            }`}
                          />
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (repository.provider === CodeRepositoryProvider.AZURE_DEV_OPS) {
                                navigate(`/code-repositories/azure/${repository._id}`);
                              } else if (repository.provider === CodeRepositoryProvider.GITHUB) {
                                navigate(`/code-repositories/github/${repository._id}`);
                              } else if (repository.provider === CodeRepositoryProvider.GITLAB) {
                                navigate(`/code-repositories/gitlab/${repository._id}`);
                              }
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={deleteRepositoryMutation.isPending}
                            onClick={() => {
                              setRepositoryToDelete({ id: repository._id, name: repository.name });
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            }
          </CardContent>
        </Card>

        <AddRepositoryDialog
          isOpen={isCreateDialogOpen}
          onOpenChange={(open) => {
            setIsCreateDialogOpen(open);
            if (!open) {
              setRepositoryToEdit(null);
            }
          }}
        />

        <DeleteConfirmationDialog
          isOpen={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onDelete={async () => {
            if (repositoryToDelete) {
              await deleteRepositoryMutation.mutateAsync(repositoryToDelete.id);
            }
          }}
          onDeleteSuccess={() => {
            setRepositoryToDelete(null);
          }}
          title={t('codeRepositories.deleteDialog.title')}
          description={repositoryToDelete ? t('codeRepositories.deleteDialog.description', { repositoryName: repositoryToDelete.name }) : ''}
        />
      </SinglePageLayout>
    </ApiDataFetcher>
  );
};

export default CodeRepositoryPage;