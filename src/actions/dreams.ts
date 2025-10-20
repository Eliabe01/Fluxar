
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
    getDoc,
} from 'firebase/firestore';
import { addTransaction } from '@/services/transactions';
import type { Dream } from '@/services/dreams';
import { z } from 'zod';

const dreamSchema = z.object({
  title: z.string().min(3, { message: 'O título deve ter pelo menos 3 caracteres.' }),
  targetAmount: z.coerce.number().positive({ message: 'A meta de valor deve ser positiva.' }),
  dueDate: z.coerce.date({ message: 'A data da meta é obrigatória.' }),
  imageFile: z.instanceof(File, { message: 'A imagem é obrigatória.' })
    .refine((file) => file.size > 0, 'A imagem é obrigatória.')
});

const updateDreamSchema = dreamSchema.extend({
  dreamId: z.string().min(1),
  imageFile: z.instanceof(File).optional(),
});


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
        throw new Error('Usuário não autenticado.');
    }

    const rawData = {
        title: formData.get('title'),
        targetAmount: formData.get('targetAmount'),
        dueDate: formData.get('dueDate'),
        imageFile: formData.get('imageFile'),
    };

    const validation = dreamSchema.safeParse(rawData);
    if (!validation.success) {
        throw new Error(validation.error.errors.map(e => e.message).join(', '));
    }
    
    const { title, targetAmount, dueDate, imageFile } = validation.data;
    
    const tempDocRef = doc(collection(db, 'users', currentUser.uid, 'dreams'));
    const { imageURL, imagePath } = await uploadImage(currentUser.uid, tempDocRef.id, imageFile);

    await addDoc(collection(db, 'users', currentUser.uid, 'dreams'), {
        title,
        targetAmount,
        dueDate,
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
        throw new Error('Usuário não autenticado.');
    }
    
    const rawData = {
        dreamId: formData.get('dreamId'),
        title: formData.get('title'),
        targetAmount: formData.get('targetAmount'),
        dueDate: formData.get('dueDate'),
        imageFile: formData.get('imageFile') || undefined,
    };
    
    const validation = updateDreamSchema.safeParse(rawData);
    if (!validation.success) {
        throw new Error(validation.error.errors.map(e => e.message).join(', '));
    }

    const { dreamId, title, targetAmount, dueDate, imageFile } = validation.data;

    const docRef = doc(db, 'users', currentUser.uid, 'dreams', dreamId);

    const updateData: any = { title, targetAmount, dueDate };

    if (imageFile && imageFile.size > 0) {
        const dreamDoc = await getDoc(docRef);
        const oldImagePath = dreamDoc.data()?.imagePath;
        if (oldImagePath) {
            const oldImageRef = ref(getStorage(), oldImagePath);
            await deleteObject(oldImageRef).catch(err => console.warn("Imagem antiga não encontrada para deletar ou erro:", err));
        }
        
        const { imageURL, imagePath } = await uploadImage(currentUser.uid, dreamId, imageFile);
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
