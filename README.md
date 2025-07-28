# InterCopy Finances (Fluxar)

Este é um aplicativo de gerenciamento financeiro construído com Next.js, React, Tailwind CSS, ShadCN UI e Firebase.

## Como fazer o deploy no Firebase Hosting

Seu projeto já está configurado para ser implantado no Firebase Hosting. Siga os passos abaixo para fazer o deploy.

### Pré-requisitos

1.  **Node.js:** Certifique-se de que você tem o Node.js instalado.
2.  **Firebase CLI:** Instale a interface de linha de comando do Firebase globalmente no seu computador. Abra seu terminal e execute:
    ```bash
    npm install -g firebase-tools
    ```

### Passo a Passo para o Deploy

1.  **Autenticação no Firebase**:
    Se for sua primeira vez usando a CLI, você precisará fazer login na sua conta do Google:
    ```bash
    firebase login
    ```
    Isso abrirá uma janela no seu navegador para autenticação.

2.  **Instalar Dependências do Projeto**:
    No terminal, navegue até a pasta raiz do seu projeto e instale todas as dependências necessárias:
    ```bash
    npm install
    ```

3.  **Fazer o Deploy**:
    Após a instalação, execute o comando de deploy:
    ```bash
    firebase deploy
    ```
    A Firebase CLI irá construir seu projeto Next.js e implantá-lo no Firebase Hosting. O processo pode levar alguns minutos.

Ao final, o terminal exibirá o URL onde seu aplicativo está no ar. Seu projeto já está conectado ao projeto do Firebase `app-de-gerenciamento-1560b` através do arquivo `.firebaserc`, então a CLI saberá exatamente para onde enviar o código.
