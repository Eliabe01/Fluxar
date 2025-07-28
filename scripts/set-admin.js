// Este script define uma "custom claim" de administrador para um usuário do Firebase.
// Uso: node scripts/set-admin.js <uid>

// Importa o SDK de Admin do Firebase
const admin = require('firebase-admin');

// Importa o arquivo da chave de serviço que você baixou do Firebase Console
// Certifique-se de que o caminho está correto.
const serviceAccount = require('./service-account-key.json');

// Inicializa o app Firebase Admin com suas credenciais
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Pega o UID do usuário a partir dos argumentos da linha de comando
const uid = process.argv[2];

if (!uid) {
  console.error('Erro: Por favor, forneça o UID do usuário como argumento.');
  console.log('Uso: node scripts/set-admin.js <uid_do_usuario>');
  process.exit(1);
}

// Define a custom claim 'admin' para o usuário especificado
admin.auth().setCustomUserClaims(uid, { admin: true })
  .then(() => {
    console.log(`Sucesso! O usuário ${uid} agora é um administrador.`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Erro ao definir a custom claim:', error);
    process.exit(1);
  });
