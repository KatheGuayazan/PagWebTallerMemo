import { db } from './firebase_init.js';
import {
    collection,
    query,
    where,
    orderBy,
    limit,
    startAt,
    endAt,
    getDocs,
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

export class FirestoreQuery {
    constructor(collectionName) {
        this.collectionRef = collection(db, collectionName);
    }

    async whereQuery(column, comparison, value) {
        const q = query(this.collectionRef, where(column, comparison, value));
        return this.runQuery(q);
    }

    async orderedQuery(column, direction = 'asc') {
        const q = query(this.collectionRef, orderBy(column, direction));
        return this.runQuery(q);
    }

    async limitedQuery(maxResults = 5) {
        const q = query(this.collectionRef, limit(maxResults));
        return this.runQuery(q);
    }

    ///////////////////////////////////////////////////////////////////

    async getUserCriticalTasks(teamId, userId) {
        const q = query(
            this.collectionRef,
            where("assignedTo", "==", userId),
            where("priority", "==", "high"),
            where("status", "==", "pending"),
            orderBy("status"),
            orderBy("createdAt")
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async getCriticalTasks(teamId) {
        const q = query(
            this.collectionRef,
            where("priority", "==", "high"),
            where("status", "==", "pending"),
            orderBy("status"),
        );

        const snapshot = await getDocs(q);
        const users = {};

        snapshot.docs.map(doc => {
            const data = doc.data();
            const userId = data.assignedTo;
    
            if (!users[userId]) {
                users[userId] = 0;
            }
    
            users[userId]++;
        });
    
        return users; 
    }

    ///////////////////////////////////////////////////////////////////

    async combinedQuery(filters = [], order = null, maxResults = null) {
        let constraints = filters.map(f => where(f.column, f.comparison, f.value));

        if (order) {
            constraints.push(orderBy(order.column, order.direction || 'asc'));
        }

        if (maxResults) {
            constraints.push(limit(maxResults));
        }

        const q = query(this.collectionRef, ...constraints);
        return this.runQuery(q);
    }



    async prefixSearch(column, prefix) {
        const endText = prefix + '\uf8ff';
        const q = query(
            this.collectionRef,
            orderBy(column),
            startAt(prefix),
            endAt(endText)
        );
        return this.runQuery(q);
    }

    async runQuery(q) {
        const snapshot = await getDocs(q);

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