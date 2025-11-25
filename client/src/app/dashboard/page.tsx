'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { dashboardService } from '@/services/dashboard.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardService.getDashboardData,
    enabled: !!user,
  });

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Sistema de Monitoramento de Saúde</h1>
              <p className="text-sm text-gray-600">Bem-vindo, {user?.name}!</p>
            </div>
            <div className="flex gap-4">
              <Link href="/chat">
                <Button variant="outline">Chat com IA</Button>
              </Link>
              <Button variant="destructive" onClick={handleLogout}>
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">
                Compromissos Próximos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {dashboardData?.upcomingAppointments?.length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">
                Medicações Hoje
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {dashboardData?.todayMedications?.length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">
                Alertas Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {dashboardData?.alerts?.length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts Section */}
        {dashboardData?.alerts && dashboardData.alerts.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Alertas</CardTitle>
              <CardDescription>Atenção necessária</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardData.alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-lg border ${
                      alert.severity === 'error'
                        ? 'bg-red-50 border-red-200'
                        : alert.severity === 'warning'
                        ? 'bg-yellow-50 border-yellow-200'
                        : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex items-start">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {alert.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(alert.createdAt).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Appointments */}
          <Card>
            <CardHeader>
              <CardTitle>Próximos Compromissos</CardTitle>
              <CardDescription>Seus agendamentos médicos</CardDescription>
            </CardHeader>
            <CardContent>
              {dashboardData?.upcomingAppointments?.length === 0 ? (
                <p className="text-sm text-gray-500">Nenhum compromisso agendado</p>
              ) : (
                <div className="space-y-4">
                  {dashboardData?.upcomingAppointments?.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="border-l-4 border-blue-500 pl-4 py-2"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">
                            {appointment.doctorName}
                          </p>
                          <p className="text-sm text-gray-600">
                            {appointment.specialty}
                          </p>
                          <p className="text-sm text-gray-500">
                            {appointment.location}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(appointment.date).toLocaleDateString('pt-BR')}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(appointment.date).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                      {appointment.notes && (
                        <p className="text-sm text-gray-600 mt-2">
                          {appointment.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Medications */}
          <Card>
            <CardHeader>
              <CardTitle>Medicações de Hoje</CardTitle>
              <CardDescription>Horários e dosagens</CardDescription>
            </CardHeader>
            <CardContent>
              {dashboardData?.todayMedications?.length === 0 ? (
                <p className="text-sm text-gray-500">Nenhuma medicação para hoje</p>
              ) : (
                <div className="space-y-4">
                  {dashboardData?.todayMedications?.map((medication) => (
                    <div
                      key={medication.id}
                      className="border-l-4 border-green-500 pl-4 py-2"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">
                            {medication.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {medication.dosage}
                          </p>
                          <p className="text-sm text-gray-500">
                            {medication.frequency}
                          </p>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs ${
                          medication.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {medication.isActive ? 'Ativo' : 'Inativo'}
                        </div>
                      </div>
                      {medication.notes && (
                        <p className="text-sm text-gray-600 mt-2">
                          {medication.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Exams */}
        {dashboardData?.recentExams && dashboardData.recentExams.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Exames Recentes</CardTitle>
              <CardDescription>Últimos resultados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.recentExams.map((exam) => (
                  <div
                    key={exam.id}
                    className="border-l-4 border-purple-500 pl-4 py-2"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{exam.type}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(exam.date).toLocaleDateString('pt-BR')}
                        </p>
                        {exam.result && (
                          <p className="text-sm text-gray-600 mt-2">
                            Resultado: {exam.result}
                          </p>
                        )}
                        {exam.notes && (
                          <p className="text-sm text-gray-600 mt-1">
                            {exam.notes}
                          </p>
                        )}
                      </div>
                      {exam.attachments && exam.attachments.length > 0 && (
                        <div className="text-sm text-blue-600">
                          {exam.attachments.length} anexo(s)
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

