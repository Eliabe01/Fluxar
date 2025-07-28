
'use server';

import { revalidatePath } from 'next/cache';
import { auth, db } from '@/lib/firebase';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import {
    collection,
    addDoc,
    doc,
    deleteDoc,
    updateDoc,
    serverTimestamp,
    runTransaction,
    collectionGroup,
} from 'firebase/firestore';
import { addTransaction } from '@/services/transactions';
import type { Dream } from '@/services/dreams';

const uploadImage = async (userId: string, dreamId: string, imageFile: File): Promise<{ imageURL: string, imagePath: string }> => {
    const storage = getStorage();
    const imagePath = `users/${userId}/dreams/${dreamId}/${imageFile.name}`;
    const storageRef = ref(storage, imagePath);
    await uploadBytes(storageRef, imageFile);
    const imageURL = await getDownloadURL(storageRef);
    return { imageURL, imagePath };
};


export const addDream = async (formData: FormData) => {
    const { currentUser } = auth;
    if (!currentUser) {
        throw new Error("Usuário não autenticado.");
    }

    const dream = {
        title: formData.get('title') as string,
        targetAmount: parseFloat(formData.get('targetAmount') as string),
        dueDate: new Date(formData.get('dueDate') as string),
    };
    const imageFile = formData.get('imageFile') as File;

    if (!imageFile) {
        throw new Error("Imagem é obrigatória.");
    }
    
    const tempDocRef = doc(collection(db, 'users', currentUser.uid, 'dreams'));
    const { imageURL, imagePath } = await uploadImage(currentUser.uid, tempDocRef.id, imageFile);

    await addDoc(collection(db, 'users', currentUser.uid, 'dreams'), {
        ...dream,
        currentAmount: 0,
        imageURL,
        imagePath,
        createdAt: serverTimestamp(),
    });

    revalidatePath('/dreams');
};

export const updateDream = async (formData: FormData) => {
    const { currentUser } = auth;
    if (!currentUser) {
        throw new Error("Usuário não autenticado.");
    }

    const dreamId = formData.get('dreamId') as string;
    const dreamData = {
        title: formData.get('title') as string,
        targetAmount: parseFloat(formData.get('targetAmount') as string),
        dueDate: new Date(formData.get('dueDate') as string),
    };
    const newImageFile = formData.get('imageFile') as File | null;

    const docRef = doc(db, 'users', currentUser.uid, 'dreams', dreamId);

    const updateData: any = { ...dreamData };

    if (newImageFile) {
        // Here you might want to delete the old image from storage first
        const { imageURL, imagePath } = await uploadImage(currentUser.uid, dreamId, newImageFile);
        updateData.imageURL = imageURL;
        updateData.imagePath = imagePath;
    }

    await updateDoc(docRef, updateData);
    revalidatePath('/dreams');
};


export const deleteDream = async (dreamId: string) => {
    const { currentUser } = auth;
    if (!currentUser) throw new Error("Usuário não autenticado.");
    
    const dreamDocRef = doc(db, 'users', currentUser.uid, 'dreams', dreamId);
    
    await runTransaction(db, async (transaction) => {
        const dreamDoc = await transaction.get(dreamDocRef);
        if (!dreamDoc.exists()) {
            throw "O sonho não existe!";
        }
        
        const imagePath = dreamDoc.data().imagePath;
        if (imagePath) {
            const storage = getStorage();
            const imageRef = ref(storage, imagePath);
            await deleteObject(imageRef).catch(err => console.warn("Imagem não encontrada para deletar ou erro:", err));
        }

        transaction.delete(dreamDocRef);
    });
    revalidatePath('/dreams');
};

export const contributeToDream = async (dreamId: string, amount: number) => {
    const { currentUser } = auth;
    if (!currentUser) throw new Error("Usuário não autenticado.");
    if (amount <= 0) throw new Error("O valor da contribuição deve ser positivo.");

    const dreamRef = doc(db, 'users', currentUser.uid, 'dreams', dreamId);

    await runTransaction(db, async (transaction) => {
        const dreamDoc = await transaction.get(dreamRef);
        if (!dreamDoc.exists()) {
            throw "O sonho não existe!";
        }

        const dream = dreamDoc.data() as Dream;
        const newCurrentAmount = dream.currentAmount + amount;

        if (newCurrentAmount > dream.targetAmount) {
            throw `A contribuição ultrapassa a meta do sonho. Você precisa de apenas ${dream.targetAmount - dream.currentAmount}.`;
        }

        await addTransaction(currentUser.uid, {
            type: 'expense',
            amount: amount,
            category: 'investment',
            description: `Contribuição para o sonho: ${dream.title}`,
            date: new Date(),
        });
        
        transaction.update(dreamRef, { currentAmount: newCurrentAmount });
    });

    revalidatePath('/dreams');
};
