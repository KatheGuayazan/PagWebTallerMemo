import { db } from './firebase_init.js';
import { collection, getDocs, getDoc, setDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

export class FirestoreService {
  constructor(collectionName = 'Sections') {
    this.collectionRef = collection(db, collectionName);
  }

  async getAllDocuments() {
    const snapshot = await getDocs(this.collectionRef);
    const data = [];
    snapshot.forEach((doc) => {
      data.push({ id: doc.id, ...doc.data() });
    });
    return data;
  }

  async getDocumentById(id) {
    const docRef = doc(this.collectionRef, id);
    const snapshot = await getDoc(docRef);
  
    if (snapshot.exists()) {
      return { id: snapshot.id, ...snapshot.data() };
    } else {
      return null; 
    }
  }

  async saveDocument(customId, dataObject) {
    const docRef = doc(this.collectionRef, customId.toString());
    await setDoc(docRef, dataObject, { merge: true });
    return { success: true, id: customId.toString() };
  }

  async getPartidas() {
    return this.getAllDocuments();
  }

  async getPartidaById(partidaId) {
    return this.getDocumentById(partidaId);
  }

  async createOrUpdatePartida(partidaId, dataObject) {
    return this.saveDocument(partidaId, dataObject);
  }

  async getComportamiento(partidaId) {
    const partida = await this.getPartidaById(partidaId);
    return partida?.Comportamiento ?? {};
  }

  async updateComportamiento(partidaId, comportamientoObject) {
    return this.saveDocument(partidaId, { Comportamiento: comportamientoObject });
  }

  async getEstadistica(partidaId) {
    const partida = await this.getPartidaById(partidaId);
    return partida?.Estadistica ?? [];
  }

  async updateEstadistica(partidaId, estadisticaArray) {
    return this.saveDocument(partidaId, { Estadistica: estadisticaArray });
  }
  
}