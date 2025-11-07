export const initialState = {
    theme: 'light',
    notifications: [],
};

export const ActionTypes = {
    SET_THEME: 'SET_THEME',
    ADD_NOTIFICATION: 'ADD_NOTIFICATION',
    REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
};

export const appReducer = (state, action) => {
    switch (action.type) {
        case ActionTypes.SET_THEME:
            return { ...state, theme: action.payload };

        case ActionTypes.ADD_NOTIFICATION:
            return {
                ...state,
                notifications: [...state.notifications, {
                    id: Date.now(),
                    message: action.payload.message,
                    type: action.payload.type || 'info',
                }],
            };

        case ActionTypes.REMOVE_NOTIFICATION:
            return {
                ...state,
                notifications: state.notifications.filter(
                    (notif) => notif.id !== action.payload
                ),
            };

        default:
            return state;
    }
};

export const createActions = (dispatch) => ({
    setTheme: (theme) =>
        dispatch({ type: ActionTypes.SET_THEME, payload: theme }),

    addNotification: (notification) =>
        dispatch({ type: ActionTypes.ADD_NOTIFICATION, payload: notification }),

    removeNotification: (id) =>
        dispatch({ type: ActionTypes.REMOVE_NOTIFICATION, payload: id }),
});

