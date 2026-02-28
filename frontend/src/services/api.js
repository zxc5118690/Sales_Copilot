import { mockApi } from './mockApi';

const API_BASE_URL = 'http://localhost:8000/api/v1';

const headers = {
    'Content-Type': 'application/json',
};

const handleResponse = async (response) => {
    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(error.detail || 'API request failed');
    }
    return response.json();
};

const realApi = {
    accounts: {
        list: async (limit = 50, offset = 0) => {
            const response = await fetch(`${API_BASE_URL}/accounts?limit=${limit}&offset=${offset}`, { headers });
            return handleResponse(response);
        },
        get: async (id) => {
            const response = await fetch(`${API_BASE_URL}/accounts/${id}`, { headers });
            return handleResponse(response);
        },
        create: async (data) => {
            const response = await fetch(`${API_BASE_URL}/accounts`, {
                method: 'POST',
                headers,
                body: JSON.stringify(data),
            });
            return handleResponse(response);
        },
        import: async (items) => {
            const response = await fetch(`${API_BASE_URL}/accounts/import`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ items }),
            });
            return handleResponse(response);
        },
        update: async (id, data) => {
            const response = await fetch(`${API_BASE_URL}/accounts/${id}`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify(data),
            });
            return handleResponse(response);
        },
        delete: async (id) => {
            const response = await fetch(`${API_BASE_URL}/accounts/${id}`, {
                method: 'DELETE',
                headers
            });
            return handleResponse(response);
        }
    },
    signals: {
        list: async (accountId) => {
            const response = await fetch(`${API_BASE_URL}/signals/accounts/${accountId}`, { headers });
            return handleResponse(response);
        },
        listGlobal: async (limit = 50) => {
            const response = await fetch(`${API_BASE_URL}/signals/global?limit=${limit}`, { headers });
            return handleResponse(response);
        },
        scan: async (accountIds, lookbackDays = 90) => {
            const response = await fetch(`${API_BASE_URL}/signals/scan`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    account_ids: accountIds,
                    lookback_days: lookbackDays,
                    use_tavily: true
                })
            });
            return handleResponse(response);
        },
        delete: async (id) => {
            const response = await fetch(`${API_BASE_URL}/signals/${id}`, {
                method: 'DELETE',
                headers
            });
            if (response.status === 404) {
                // Treat stale rows as already deleted to keep UI action idempotent.
                return { status: 'deleted', signal_id: id, already_missing: true };
            }
            return handleResponse(response);
        }
    },
    pains: {
        list: async (accountId) => {
            const response = await fetch(`${API_BASE_URL}/pain-profiles/accounts/${accountId}`, { headers });
            return handleResponse(response);
        },
        listGlobal: async (limit = 50) => {
            const response = await fetch(`${API_BASE_URL}/pain-profiles/global?limit=${limit}`, { headers });
            return handleResponse(response);
        },
        generate: async (accountId, options = {}) => {
            const response = await fetch(`${API_BASE_URL}/pain-profiles/generate`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    account_id: accountId,
                    persona_targets: options.personaTargets || ["RD", "NPI", "PROCUREMENT"],
                    ...(options.signalIds?.length ? { signal_ids: options.signalIds } : {}),
                    ...(options.userAnnotations ? { user_annotations: options.userAnnotations } : {}),
                })
            });
            return handleResponse(response);
        },
        update: async (painId, data) => {
            const response = await fetch(`${API_BASE_URL}/pain-profiles/${painId}`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify(data)
            });
            return handleResponse(response);
        },
        delete: async (painId) => {
            const response = await fetch(`${API_BASE_URL}/pain-profiles/${painId}`, {
                method: 'DELETE',
                headers
            });
            if (response.status === 404) {
                return { status: 'deleted', pain_id: painId, already_missing: true };
            }
            return handleResponse(response);
        }
    },
    contacts: {
        list: async (accountId) => {
            const response = await fetch(`${API_BASE_URL}/contacts?account_id=${accountId}`, { headers });
            return handleResponse(response);
        },
        create: async (data) => {
            const response = await fetch(`${API_BASE_URL}/contacts`, {
                method: 'POST',
                headers,
                body: JSON.stringify(data)
            });
            return handleResponse(response);
        },
        delete: async (id) => {
            const response = await fetch(`${API_BASE_URL}/contacts/${id}`, {
                method: 'DELETE',
                headers
            });
            return handleResponse(response);
        }
    },
    outreach: {
        listByContact: async (contactId) => {
            const response = await fetch(`${API_BASE_URL}/outreach/contacts/${contactId}`, { headers });
            return handleResponse(response);
        },
        listGlobal: async (limit = 50) => {
            const response = await fetch(`${API_BASE_URL}/outreach/global?limit=${limit}`, { headers });
            return handleResponse(response);
        },
        generate: async (contactId, options = {}) => {
            const response = await fetch(`${API_BASE_URL}/outreach/generate`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    contact_id: contactId,
                    channel: options.channel || 'EMAIL',
                    intent: options.intent || 'FIRST_TOUCH',
                    tone: options.tone || 'TECHNICAL'
                })
            });
            return handleResponse(response);
        },
        updateStatus: async (draftId, status) => {
            const response = await fetch(`${API_BASE_URL}/outreach/${draftId}/status`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify({ status })
            });
            return handleResponse(response);
        }
    },
    bant: {
        list: async (accountId) => {
            const response = await fetch(`${API_BASE_URL}/bant/accounts/${accountId}`, { headers });
            return handleResponse(response);
        },
        score: async (accountId) => {
            const response = await fetch(`${API_BASE_URL}/bant/score`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ account_id: accountId })
            });
            return handleResponse(response);
        }
    },
    interactions: {
        list: async (accountId) => {
            const response = await fetch(`${API_BASE_URL}/interactions/accounts/${accountId}`, { headers });
            return handleResponse(response);
        },
        log: async (data) => {
            const response = await fetch(`${API_BASE_URL}/interactions/log`, {
                method: 'POST',
                headers,
                body: JSON.stringify(data)
            });
            return handleResponse(response);
        }
    },
    pipeline: {
        getBoard: async () => {
            const response = await fetch(`${API_BASE_URL}/pipeline/board`, { headers });
            return handleResponse(response);
        }
    },
    knowledgeDocs: {
        list: async (params = {}) => {
            const query = new URLSearchParams();
            if (params.account_id != null) query.set('account_id', params.account_id);
            if (params.scope != null) query.set('scope', params.scope);
            if (params.limit != null) query.set('limit', params.limit);
            const response = await fetch(`${API_BASE_URL}/knowledge-docs?${query}`, { headers });
            return handleResponse(response);
        },
        listByAccount: async (accountId) => {
            const response = await fetch(`${API_BASE_URL}/knowledge-docs/accounts/${accountId}`, { headers });
            return handleResponse(response);
        },
        create: async (data) => {
            const response = await fetch(`${API_BASE_URL}/knowledge-docs`, {
                method: 'POST',
                headers,
                body: JSON.stringify(data),
            });
            return handleResponse(response);
        },
        update: async (docId, data) => {
            const response = await fetch(`${API_BASE_URL}/knowledge-docs/${docId}`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify(data),
            });
            return handleResponse(response);
        },
        delete: async (docId) => {
            const response = await fetch(`${API_BASE_URL}/knowledge-docs/${docId}`, {
                method: 'DELETE',
                headers,
            });
            return handleResponse(response);
        },
    }
};

// Data Source Configuration
const MODE_KEY = 'DATA_SOURCE_MODE';
const getMode = () => localStorage.getItem(MODE_KEY) || 'mock';

export const setDataSourceMode = (mode) => {
    localStorage.setItem(MODE_KEY, mode);
    window.location.reload();
};

export const getDataSourceMode = () => getMode();

// Proxy API to switch implementation based on mode
export const api = new Proxy({}, {
    get: (target, prop) => {
        const mode = getMode();
        const implementation = mode === 'real' ? realApi : mockApi;
        return implementation[prop];
    }
});
