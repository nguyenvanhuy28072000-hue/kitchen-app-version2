//==================================================
// ログイン処理
//==================================================
const button =
document.getElementById("loginButton");

function login() {

    //----------------------------------
    // 入力されたメールアドレス取得
    //----------------------------------

    const email =
        document.getElementById("email").value;


    //----------------------------------
    // 入力されたパスワード取得
    //----------------------------------

    const password =
        document.getElementById("password").value;


    //----------------------------------
    // Firebase Authenticationでログイン
    //----------------------------------
    button.disabled = true;
    button.textContent =
    "ログイン中...";
    firebase.auth()

        .signInWithEmailAndPassword(
            email,
            password
        )

        //----------------------------------
        // ログイン成功
        //----------------------------------

        .then(() => {
            button.disabled = false;
            // メイン画面へ移動
            location.href = "index.html";

        })

        //----------------------------------
        // ログイン失敗
        //----------------------------------

        .catch(error => {
            button.disabled = false;
            button.textContent =
            "ログイン";
            switch (error.code) {

                //------------------------------
                // メールまたはパスワード違い
                //------------------------------

                case "auth/invalid-login-credentials":
                case "auth/wrong-password":
                case "auth/user-not-found":
                case "auth/invalid-credential":

                    alert(
                        "メールアドレスまたはパスワードが間違っています。"
                    );
                    break;


                //------------------------------
                // メール形式エラー
                //------------------------------

                case "auth/invalid-email":

                    alert(
                        "メールアドレスの形式が正しくありません。"
                    );
                    break;


                //------------------------------
                // ログイン試行回数が多すぎる
                //------------------------------

                case "auth/too-many-requests":

                    alert(
                        "何度も失敗したため、一時的にログインできません。\nしばらく待ってからお試しください。"
                    );
                    break;


                //------------------------------
                // その他
                //------------------------------

                default:

                    alert(
                        "ログインに失敗しました。\n\n" +
                        error.message
                    );

            }

        });

}


//==================================================
// Enterキーでもログインできるようにする
//==================================================

document.addEventListener("keydown", function(event){

    if(event.key === "Enter"){

        login();

    }

});


//==================================================
// HTMLから呼び出せるよう公開
//==================================================

window.login = login;