# Como se Tornar um Administrador Supremo (Super Admin)

Siga estes passos para conceder permissões de administrador a um usuário específico usando o Firebase Admin SDK no seu computador local. Este é o método mais seguro.

### Passo 1: Baixe sua Chave de Serviço do Firebase

1.  Acesse o **Console do Firebase**: [https://console.firebase.google.com/](https://console.firebase.google.com/)
2.  Selecione seu projeto: `app-de-gerenciamento-1560b`.
3.  Vá para **Configurações do projeto** (clicando na engrenagem ao lado de "Visão geral do projeto").
4.  Clique na aba **Contas de serviço**.
5.  Selecione "Node.js" e clique no botão **Gerar nova chave privada**.
6.  Um arquivo `.json` será baixado. **TRATE ESTE ARQUIVO COMO UMA SENHA!** Não o compartilhe e não o envie para repositórios de código.
7.  Renomeie este arquivo para `service-account-key.json` e coloque-o dentro desta pasta (`/scripts`).

### Passo 2: Instale as Dependências

Abra seu terminal na pasta raiz do projeto e instale as dependências necessárias para o script:

```bash
npm install firebase-admin
```

### Passo 3: Encontre o UID do Usuário

1.  Vá para o **Firebase Console**.
2.  No menu, acesse **Authentication**.
3.  Na lista de usuários, encontre a conta que você deseja tornar administradora e copie o **UID do usuário**.

### Passo 4: Execute o Script de Administração

Ainda no seu terminal, na raiz do projeto, execute o seguinte comando, substituindo `[UID_DO_USUARIO_AQUI]` pelo UID que você copiou:

```bash
node scripts/set-admin.js [UID_DO_USUARIO_AQUI]
```

**Exemplo:**
```bash
node scripts/set-admin.js aBcDeFgHiJkLmNoPqRsTuVwXyZ123
```

Se tudo der certo, você verá a mensagem "Sucesso! O usuário [UID] agora é um administrador." no seu terminal.

Pronto! O usuário agora tem permissões de administrador, que podem ser usadas nas Regras de Segurança do Firestore.
