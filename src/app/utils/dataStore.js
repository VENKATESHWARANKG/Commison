import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  ledgers: 'data:ledgers',
  buyers: 'data:buyers',
  sellers: 'data:sellers',
  invoices: 'data:invoices',
  payments: 'data:payments',
  expenses: 'data:expenses',
  returns: 'data:returns',
  transporters: 'data:transporters',
  lrs: 'data:lrs',
  orders: 'data:orders',
  journals: 'data:journals',
  profile: 'data:profile',
};

async function getList(key) {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('dataStore read error for', key, e);
    return [];
  }
}

async function setList(key, list) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(list));
    return true;
  } catch (e) {
    console.error('dataStore write error for', key, e);
    return false;
  }
}

async function addItem(key, item) {
  const list = await getList(key);
  const withId = { id: item.id || `${key}-${Date.now()}`, createdAt: new Date().toISOString(), ...item };
  const next = [withId, ...list];
  await setList(key, next);
  return withId;
}

async function removeItem(key, id) {
  const list = await getList(key);
  const next = list.filter((item) => item.id !== id);
  await setList(key, next);
  return next;
}

// One factory used for every entity so behavior stays identical everywhere.
function makeEntity(key) {
  return {
    getAll: () => getList(key),
    add: (item) => addItem(key, item),
    remove: (id) => removeItem(key, id),
    setAll: (list) => setList(key, list),
  };
}

// The signed-up person's own details (one record, not a list)
const profileStore = {
  get: async () => {
    try {
      const raw = await AsyncStorage.getItem(KEYS.profile);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error('dataStore read error for', KEYS.profile, e);
      return null;
    }
  },
  set: async (profile) => {
    try {
      await AsyncStorage.setItem(KEYS.profile, JSON.stringify(profile));
      return true;
    } catch (e) {
      console.error('dataStore write error for', KEYS.profile, e);
      return false;
    }
  },
};

export const dataStore = {
  ledgers: makeEntity(KEYS.ledgers),
  buyers: makeEntity(KEYS.buyers),
  sellers: makeEntity(KEYS.sellers),
  invoices: makeEntity(KEYS.invoices),
  payments: makeEntity(KEYS.payments),
  expenses: makeEntity(KEYS.expenses),
  returns: makeEntity(KEYS.returns),
  transporters: makeEntity(KEYS.transporters),
  lrs: makeEntity(KEYS.lrs),
  orders: makeEntity(KEYS.orders),
  journals: makeEntity(KEYS.journals),
  profile: profileStore,
};

export default dataStore;