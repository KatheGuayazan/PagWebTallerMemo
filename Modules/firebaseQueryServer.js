const db = require('./firebase.service.js');

class FirestoreQuery {
  constructor(collectionPath) {
    this.collectionPath = collectionPath;
  }

  async whereQuery(column, comparison, value) {
    const ref = db.collection(this.collectionPath);
    const q = ref.where(column, comparison, value);
    return this.runQuery(q);
  }

  async orderedQuery(column, direction = 'asc') {
    const ref = db.collection(this.collectionPath);
    const q = ref.orderBy(column, direction);
    return this.runQuery(q);
  }

  async limitedQuery(maxResults = 5) {
    const ref = db.collection(this.collectionPath);
    const q = ref.limit(maxResults);
    return this.runQuery(q);
  }

  async getUserCriticalTasks(teamId, userId) {
    const ref = db.collection(this.collectionPath);
    const q = ref
      .where('assignedTo', '==', userId)
      .where('priority', '==', 'high')
      .where('status', '==', 'pending')
      .orderBy('status')
      .orderBy('createdAt');
    
    const snapshot = await q.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async getCriticalTasks(teamId) {
    const ref = db.collection(this.collectionPath);
    const q = ref
      .where('priority', '==', 'high')
      .where('status', '==', 'pending')
      .orderBy('status');
    
    const snapshot = await q.get();
    const users = {};

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const userId = data.assignedTo;

      if (!users[userId]) {
        users[userId] = 0;
      }

      users[userId]++;
    });

    return users;
  }

  async combinedQuery(filters = [], order = null, maxResults = null) {
    let ref = db.collection(this.collectionPath);

    // Aplicar filtros
    filters.forEach(f => {
      ref = ref.where(f.column, f.comparison, f.value);
    });

    // Aplicar ordenamiento
    if (order) {
      ref = ref.orderBy(order.column, order.direction || 'asc');
    }

    // Aplicar límite
    if (maxResults) {
      ref = ref.limit(maxResults);
    }

    return this.runQuery(ref);
  }

  async prefixSearch(column, prefix) {
    const endText = prefix + '\uf8ff';
    const ref = db.collection(this.collectionPath);
    const q = ref
      .orderBy(column)
      .startAt(prefix)
      .endAt(endText);
    
    return this.runQuery(q);
  }

  async runQuery(query) {
    const snapshot = await query.get();

    if (snapshot.empty) {
      console.log('No matching documents.');
      return [];
    }

    const results = [];
    snapshot.forEach(doc => {
      console.log(doc.id, '=>', doc.data());
      results.push({ id: doc.id, ...doc.data() });
    });
    return results;
  }
}

module.exports = FirestoreQuery;
