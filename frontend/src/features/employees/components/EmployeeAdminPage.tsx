import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { type FormEvent, useState } from 'react'

import type { EmployeeSummary } from '@/features/auth/types'
import { createEmployee, deleteEmployee, fetchEmployees, updateEmployee } from '@/features/employees/api'
import type { EmployeeListResponse } from '@/features/employees/types'
import type { HttpClientError } from '@/shared/api/httpClient'
import { PageLoader } from '@/shared/components/layout/PageLoader'

const EMPLOYEE_LIST_KEY = ['employees', 'list'] as const

interface FormState {
  id: number | null
  firstName: string
  lastName: string
  email: string
  password: string
  admin: boolean
}

const emptyForm: FormState = {
  id: null,
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  admin: false,
}

const toMessage = (error: HttpClientError) => {
  if (typeof error.payload === 'string') {
    return error.payload
  }
  return error.message || 'エラーが発生しました。'
}

export const EmployeeAdminPage = () => {
  const queryClient = useQueryClient()
  const [formState, setFormState] = useState<FormState>(emptyForm)
  const [feedback, setFeedback] = useState<string | null>(null)

  const { data, isLoading } = useQuery<EmployeeListResponse>({
    queryKey: EMPLOYEE_LIST_KEY,
    queryFn: () => fetchEmployees(false),
    staleTime: 30 * 1000,
  })

  const createMutation = useMutation({
    mutationFn: createEmployee,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: EMPLOYEE_LIST_KEY })
      setFeedback('従業員を登録しました。')
      setFormState(emptyForm)
    },
    onError: (error: HttpClientError) => {
      setFeedback(toMessage(error))
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number
      payload: Partial<Omit<EmployeeSummary, 'id'>> & { password?: string }
    }) => updateEmployee(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: EMPLOYEE_LIST_KEY })
      setFeedback('従業員情報を更新しました。')
      setFormState(emptyForm)
    },
    onError: (error: HttpClientError) => {
      setFeedback(toMessage(error))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteEmployee,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: EMPLOYEE_LIST_KEY })
      setFeedback('従業員を削除しました。')
    },
    onError: () => {
      setFeedback('削除に失敗しました。')
    },
  })

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFeedback(null)

    if (!formState.firstName || !formState.lastName || !formState.email) {
      setFeedback('必須項目が入力されていません。')
      return
    }

    if (formState.id === null) {
      await createMutation.mutateAsync({
        firstName: formState.firstName,
        lastName: formState.lastName,
        email: formState.email,
        password: formState.password,
        admin: formState.admin,
      })
    } else {
      const updatePayload: Partial<Omit<EmployeeSummary, 'id'>> & { password?: string } = {
        firstName: formState.firstName,
        lastName: formState.lastName,
        email: formState.email,
        admin: formState.admin,
      }
      if (formState.password) {
        updatePayload.password = formState.password
      }

      await updateMutation.mutateAsync({
        id: formState.id,
        payload: updatePayload,
      })
    }
  }

  const startEdit = (employee: EmployeeSummary) => {
    setFeedback(null)
    setFormState({
      id: employee.id,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      password: '',
      admin: employee.admin,
    })
  }

  const handleDelete = async (employeeId: number) => {
    if (!window.confirm('従業員を削除しますか？')) return
    await deleteMutation.mutateAsync(employeeId)
  }

  if (isLoading || !data) {
    return <PageLoader label="従業員情報を読み込み中" />
  }

  return (
    <section className="admin">
      <header className="admin__header">
        <h1>従業員管理</h1>
        <p>登録・更新・削除を行えます。更新時はパスワードを空にすると変更されません。</p>
      </header>

      <div className="admin__layout">
        <form className="admin__form" onSubmit={(event) => { void handleSubmit(event) }}>
          <h2 className="admin__form-title">{formState.id === null ? '新規登録' : '従業員情報の編集'}</h2>
          <label className="admin__label" htmlFor="firstName">
            姓
          </label>
          <input
            id="firstName"
            className="admin__input"
            value={formState.firstName}
            onChange={(event) => {
              setFormState((prev) => ({ ...prev, firstName: event.target.value }))
            }}
            required
          />

          <label className="admin__label" htmlFor="lastName">
            名
          </label>
          <input
            id="lastName"
            className="admin__input"
            value={formState.lastName}
            onChange={(event) => {
              setFormState((prev) => ({ ...prev, lastName: event.target.value }))
            }}
            required
          />

          <label className="admin__label" htmlFor="email">
            メールアドレス
          </label>
          <input
            id="email"
            type="email"
            className="admin__input"
            value={formState.email}
            onChange={(event) => {
              setFormState((prev) => ({ ...prev, email: event.target.value }))
            }}
            required
          />

          <label className="admin__label" htmlFor="password">
            パスワード
          </label>
          <input
            id="password"
            type="password"
            className="admin__input"
            value={formState.password}
            onChange={(event) => {
              setFormState((prev) => ({ ...prev, password: event.target.value }))
            }}
            placeholder={formState.id === null ? '8文字以上で入力してください' : '変更する場合のみ入力'}
            minLength={formState.id === null ? 8 : undefined}
            required={formState.id === null}
          />

          <label className="admin__checkbox">
            <input
              type="checkbox"
              checked={formState.admin}
              onChange={(event) => {
                setFormState((prev) => ({ ...prev, admin: event.target.checked }))
              }}
            />
            管理者権限
          </label>

          {feedback ? <p className="admin__feedback">{feedback}</p> : null}

          <div className="admin__actions">
            <button type="submit" className="button" disabled={createMutation.isPending || updateMutation.isPending}>
              {formState.id === null ? '登録する' : '更新する'}
            </button>
            {formState.id !== null ? (
              <button
                type="button"
                className="button"
                onClick={() => {
                  setFormState(emptyForm)
                  setFeedback(null)
                }}
                style={{ backgroundColor: '#475569' }}
              >
                クリア
              </button>
            ) : null}
          </div>
        </form>

        <div className="admin__table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>氏名</th>
                <th>メールアドレス</th>
                <th>ロール</th>
                <th aria-label="Actions">操作</th>
              </tr>
            </thead>
            <tbody>
              {data.employees.map((employee) => (
                <tr key={employee.id}>
                  <td>{employee.id}</td>
                  <td>
                    {employee.lastName} {employee.firstName}
                  </td>
                  <td>{employee.email}</td>
                  <td>{employee.admin ? '管理者' : '一般'}</td>
                  <td className="admin-table__actions">
                    <button
                      type="button"
                      className="button"
                      onClick={() => {
                        startEdit(employee)
                      }}
                    >
                      編集
                    </button>
                    <button
                      type="button"
                      className="button"
                      onClick={() => {
                        void handleDelete(employee.id)
                      }}
                      style={{ backgroundColor: '#dc2626' }}
                    >
                      削除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
