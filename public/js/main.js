    import { FirestoreService } from './modules/firestore_service.js';
    import { FirestoreQuery } from './modules/firestore_query.js';

    let firestoreS = null
    let firestoreQ = null

    let projectId = '';
    let taskId = '';

    document.getElementById("getSeedBtn").addEventListener("click", async () => {
        const teamId = document.getElementById("getTeamId").value.trim();
            projectId = document.getElementById("getProjectId").value.trim();
        taskId = document.getElementById("getTaskId").value.trim();

        firestoreS = new FirestoreService(`/${teamId}/${projectId}/${taskId}/`);
        firestoreQ = new FirestoreQuery(`/${teamId}/${projectId}/${taskId}/`);
        console.log(firestoreS);
    });

    document.getElementById("loadDataBtn").addEventListener("click", async () => {
        const docs = await firestoreS.getAllDocuments();
        console.log("Obtained Docs:", docs);
    });

    document.getElementById("addTask").addEventListener("click", async () => {
        const taskId = document.getElementById("taskId").value.trim();
        const assignedTo = document.getElementById("assignedTo").value.trim();
        const priority = document.getElementById("priority").value.trim();
        const status = document.getElementById("status").value.trim();
        const createdAt = document.getElementById("createdAt").value;

        const data = {
            assignedTo,
            priority,
            status,
            createdAt
        };

        await firestoreS.PostDocument(taskId, data);
    });

    document.getElementById("getUserCriticalTask").addEventListener("click", async () => {
        const teamId = document.getElementById("getTeamId").value.trim();
        const userId = document.getElementById("getUserId").value.trim();

        firestoreQ = new FirestoreQuery(`/${teamId}/${projectId}/${taskId}/`);

        const tasks = await firestoreQ.getUserCriticalTasks(teamId, userId);
        console.log(tasks);
    });

    document.getElementById("getHighPriority").addEventListener("click", async () => {
        const teamId = document.getElementById("getTeamId").value.trim();

        firestoreQ = new FirestoreQuery(`/${teamId}/${projectId}/${taskId}/`);

        const tasks = await firestoreQ.getCriticalTasks(teamId);
        console.log(tasks);
    });