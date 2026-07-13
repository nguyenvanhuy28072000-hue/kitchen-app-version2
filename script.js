//==================================================
// script.js
// Part 1 / 8
// グローバル変数・初期処理
//==================================================

// 最新の注文一覧（30秒ごとの再描画に使用）
let latestSnapshot = null;

// コース名 → 料理一覧
let courseData = {};

// コース名 → コース時間
let courseDuration = {};


//==================================================
// コース一覧取得
// Firestoreから courses コレクションを読む
//==================================================
function loadCourses(){

    return window.db.collection("courses")
    .get()

    .then(snapshot=>{

        courseData = {};
        courseDuration = {};

        const select =
        document.getElementById("courseSelect");

        select.innerHTML =
        '<option value="">コース選択</option>';

        snapshot.forEach(doc=>{

            const data = doc.data();

            //料理一覧保存
            courseData[doc.id] =
            data.dishes || [];

            //コース時間保存
            courseDuration[doc.id] =
            data.duration || 90;

            //セレクトへ追加
            select.innerHTML += `
            <option value="${doc.id}">
                ${doc.id}
            </option>
            `;

        });

    });

}


//==================================================
// 注文追加
//==================================================
function addCourse(){

    const time =
    document.getElementById("courseTime").value;

    const course =
    document.getElementById("courseSelect").value;

    const people =
    document.getElementById("people").value;

    const table =
    document.getElementById("tableNo").value;

    //-----------------------------
    // 入力チェック
    //-----------------------------
    if(!time || !course || !people || !table){

        alert("未入力があります");

        return;

    }

    //-----------------------------
    // コース料理作成
    //-----------------------------
    const dishes =
    (courseData[course] || []).map(name=>({

        name:name,

        done:false

    }));

    //-----------------------------
    // Firestoreへ保存
    //-----------------------------
    window.db.collection("orders")
    .add({

        time:time,

        course:course,

        people:Number(people),

        table:table,

        dishes:dishes,

        extraDishes:[],

        createdAt:Date.now()

    })

    .then(()=>{

        document.getElementById("people").value="";
        document.getElementById("tableNo").value="";

    })

    .catch(error=>{

        alert(error.message);

    });

}


//==================================================
// 注文情報更新
//==================================================
function updateField(orderId,field,value){

    const updateData={};

    updateData[field] =
    field==="people"
    ? Number(value)
    : value;

    window.db.collection("orders")
    .doc(orderId)
    .update(updateData);

}


//==================================================
// ログアウト
//==================================================
function logout(){

    firebase.auth()

    .signOut()

    .then(()=>{

        location.href="login.html";

    });

}


//==================================================
// ログイン確認
//==================================================
firebase.auth().onAuthStateChanged(user=>{

    //-----------------------------
    // 未ログイン
    //-----------------------------
    if(!user){

        location.href="login.html";

        return;

    }

    //-----------------------------
    // コース読込
    //-----------------------------
    loadCourses()

    .then(()=>{

        //-------------------------
        // 注文一覧監視
        //-------------------------
        window.db.collection("orders")

        .onSnapshot(snapshot=>{

            latestSnapshot = snapshot;

            renderOrders(snapshot);

        });

        //-------------------------
        // 完了一覧監視
        //-------------------------
        window.db.collection("completedOrders")

        .onSnapshot(snapshot=>{

            renderCompleted(snapshot);

        });

    });

});
//==================================================
// 注文一覧表示
//==================================================
function renderOrders(snapshot){

    const body =
    document.getElementById("courseBody");

    body.innerHTML = "";

    let startedHtml = "";
    let waitingHtml = "";

    //-----------------------------
    // 時間順→登録順
    //-----------------------------
    const orders = snapshot.docs.sort((a,b)=>{

        const aData = a.data();
        const bData = b.data();

        const timeCompare =
        aData.time.localeCompare(bData.time);

        if(timeCompare !== 0){
            return timeCompare;
        }

        return (
            (aData.createdAt || 0)
            -
            (bData.createdAt || 0)
        );

    });

    //-----------------------------
    // 1件ずつ表示
    //-----------------------------
    orders.forEach(doc=>{

        const order = doc.data();
        const id = doc.id;

        //-------------------------
        // コース選択
        //-------------------------
        let courseOptions = "";

        Object.keys(courseData).forEach(course=>{

            courseOptions += `
            <option
                value="${course}"
                ${order.course===course?"selected":""}
            >
                ${course}
            </option>
            `;

        });

        //-------------------------
        // 開始時間
        //-------------------------
        const [hour,minute] =
        order.time.split(":");

        const startTime =
        new Date();

        startTime.setHours(Number(hour));
        startTime.setMinutes(Number(minute));
        startTime.setSeconds(0);

        //-------------------------
        // コース時間
        //-------------------------
        const duration =
        courseDuration[order.course] || 90;

        //-------------------------
        // ラストオーダー
        //-------------------------
        const loTime =
        new Date(startTime);

        loTime.setMinutes(
            loTime.getMinutes()+duration
        );

        let loText =
        loTime.getHours()
        .toString()
        .padStart(2,"0")
        +
        ":"
        +
        loTime.getMinutes()
        .toString()
        .padStart(2,"0");

        //-------------------------
        // 現在時刻
        //-------------------------
        const now = new Date();
        const nowMinutes =
        now.getHours()*60 +
        now.getMinutes();

        const remainMinutes =
        Math.floor(
            (
                loTime.getTime()
                -
                now.getTime()
            )/60000
        );

        const startMinutes =
        Number(hour)*60+
        Number(minute);      

        //-------------------------
        // 進捗率
        //-------------------------
        let progress =
        (
            (nowMinutes-startMinutes)
            /
            duration
        )*100;

        progress =
        Math.max(
            0,
            Math.min(progress,100)
        );

        //-------------------------
        // セル数
        //-------------------------
        const totalCols =
        order.dishes.length +
        (
            order.extraDishes
            ? order.extraDishes.length
            : 0
        );

        //-------------------------
        // 行カラー
        //-------------------------
        const colors=[

            "#eeeeee",
            "#d6ecff",
            "#dff7df",
            "#fff7c7",
            "#ffe4c4",
            "#ffd6d6",
            "#e8d6ff",
            "#d6fff7",
            "#ffe8b3",
            "#d9f0ff"

        ];

        const courseNames =
        Object.keys(courseData);

        const colorIndex =
        courseNames.indexOf(order.course)
        %
        colors.length;

        const rowColor =
        colors[colorIndex];

        //-------------------------
        // L.O色
        //-------------------------
        let loClass = "";
        let progressClass = "";

        if(remainMinutes<0){

            loClass="loRed";
            progressClass="progressRed";
            loText="L.O.過ぎ";

        }
        else if(remainMinutes<=10){

            loClass="loRed";
            progressClass="progressRed";

        }
        else if(remainMinutes<=30){

            loClass="loYellow";
            progressClass="progressYellow";

        }

        //-------------------------
        // HTML開始
        //-------------------------
        let html = `
        <tr style="background:${rowColor}">

            <td>
                <button onclick="addExtraDish('${id}')">
                    ＋料理
                </button>
            </td>

            <td>
                <button onclick="deleteOrder('${id}')">
                    削除
                </button>
            </td>

            <td>
                <input
                    type="time"
                    value="${order.time}"
                    onchange="updateField('${id}','time',this.value)">
            </td>

            <td>
                <select onchange="updateCourse('${id}',this.value)">
                    ${courseOptions}
                </select>
            </td>

            <td>
                <input
                    type="number"
                    style="width:55px;"
                    value="${order.people}"
                    onchange="updateField('${id}','people',this.value)">
                名
            </td>

            <td>
                <input
                    type="text"
                    value="${order.table}"
                    onchange="updateField('${id}','table',this.value)">
            </td>

            <td
                id="lo-${id}"
                class="${loClass}">
                ${loText}
            </td>
        `;
        //-------------------------
        // コース料理表示
        //-------------------------
        order.dishes.forEach((dish,index)=>{

            html += `
            <td
                class="dish dish${index} ${dish.done ? "done" : ""}"

                draggable="true"

                ondragstart="
                    dragDish(
                        '${id}',
                        ${index}
                    )
                "

                ondragover="event.preventDefault()"

                ondrop="
                    dropDish(
                        '${id}',
                        ${index}
                    )
                "

                onclick="
                    toggleDish(
                        '${id}',
                        ${index}
                    )
                "
            >
                ${dish.name}
            </td>
            `;

        });

        //-------------------------
        // 追加料理表示
        //-------------------------
        if(order.extraDishes){

            order.extraDishes.forEach((dish,index)=>{

                html += `
                <td

                    class="
                        dish
                        extraDish
                        ${dish.done ? "done" : ""}
                    "

                    draggable="true"

                    ondragstart="
                        dragExtraDish(
                            '${id}',
                            ${index}
                        )
                    "

                    ondragover="event.preventDefault()"

                    ondrop="
                        dropExtraDish(
                            '${id}',
                            ${index}
                        )
                    "

                    onclick="
                        toggleExtraDish(
                            '${id}',
                            ${index}
                        )
                    "

                >

                    ★${dish.name}

                </td>
                `;

            });

        }

        //-------------------------
        // 進捗バー
        //-------------------------
        html += `

        </tr>

        <tr style="background:${rowColor}">

            <td colspan="7"></td>

            <td colspan="${totalCols}">

                <div class="progressWrap">

                    <div

                        id="progress-${id}"

                        class="progressBar ${progressClass}"

                        style="width:${progress}%"

                    ></div>

                </div>

            </td>

        </tr>

        `;

        //-------------------------
        // 開始済み判定
        //-------------------------
        const started =
        nowMinutes >= startMinutes;

        if(started){

            startedHtml += html;

        }else{

            waitingHtml += html;

        }

    });

    //-------------------------
    // 画面へ表示
    //-------------------------
    body.innerHTML =

    `

    <tr>

        <td colspan="20" class="sectionTitle">

            進行中コース

        </td>

    </tr>

    `

    +

    startedHtml

    +

    `

    <tr>

        <td colspan="20" class="sectionTitle">

            開始前コース

        </td>

    </tr>

    `

    +

    waitingHtml;

}
//==================================================
// 料理提供切替
//==================================================
function toggleDish(orderId,index){

    const ref=
    window.db.collection("orders").doc(orderId);

    ref.get().then(doc=>{

        const data=doc.data();

        //提供状態切替
        data.dishes[index].done=
        !data.dishes[index].done;

        //全部提供済み？
        const allDone=
        data.dishes.every(d=>d.done);

        if(allDone){

            //完了一覧へ移動
            window.db.collection("completedOrders").add({

                ...data,

                completedTime:
                new Date().toLocaleTimeString("ja-JP"),

                completedAt:
                Date.now()

            });

            ref.delete();

        }else{

            ref.update({

                dishes:data.dishes

            });

        }

    });

}

//==================================================
// 追加料理提供切替
//==================================================
function toggleExtraDish(orderId,index){

    const ref=
    window.db.collection("orders").doc(orderId);

    ref.get().then(doc=>{

        const data=doc.data();

        const extra=
        data.extraDishes||[];

        extra[index].done=
        !extra[index].done;

        ref.update({

            extraDishes:extra

        });

    });

}

//==================================================
// 注文削除
//==================================================
function deleteOrder(orderId){

    if(!confirm("削除しますか？")){

        return;

    }

    window.db
    .collection("orders")
    .doc(orderId)
    .delete();

}

//==================================================
// 完了済み→注文へ戻す
//==================================================
function restoreOrder(orderId){

    const ref=
    window.db
    .collection("completedOrders")
    .doc(orderId);

    ref.get().then(doc=>{

        const data=doc.data();

        delete data.completedTime;
        delete data.completedAt;

        window.db
        .collection("orders")
        .add(data);

        ref.delete();

    });

}

//==================================================
// コース変更
//==================================================
function updateCourse(orderId,newCourse){

    window.db
    .collection("orders")
    .doc(orderId)
    .update({

        course:newCourse,

        dishes:
        (courseData[newCourse]||[])
        .map(name=>({

            name:name,

            done:false

        })),

        extraDishes:[]

    });

}

//==================================================
// 追加料理
//==================================================
function addExtraDish(orderId){

    const choice=prompt(

`追加料理

0：最後を削除
1：焼き鳥
2：宮炭`

    );

    const ref=
    window.db.collection("orders").doc(orderId);

    ref.get().then(doc=>{

        const data=doc.data();

        let extra=
        data.extraDishes||[];

        //削除
        if(choice==="0"){

            if(extra.length===0){

                alert("追加料理がありません");

                return;

            }

            extra.pop();

            ref.update({

                extraDishes:extra

            });

            return;

        }

        let name="";

        if(choice==="1"){

            name="焼き鳥";

        }

        if(choice==="2"){

            name="宮炭";

        }

        if(!name){

            return;

        }

        extra.push({

            name:name,

            done:false

        });

        ref.update({

            extraDishes:extra

        });

    });

}
//==================================================
// ドラッグ＆ドロップ（コース料理）
//==================================================

// ドラッグ中の注文ID
let dragOrderId = null;

// ドラッグ中の料理番号
let dragIndex = null;

//------------------------------
// ドラッグ開始
//------------------------------
function dragDish(orderId,index){

    dragOrderId = orderId;
    dragIndex = index;

}

//------------------------------
// ドロップ
//------------------------------
function dropDish(orderId,dropIndex){

    //違う注文には移動できない
    if(dragOrderId !== orderId) return;

    if(dragIndex === null) return;

    const ref =
    window.db.collection("orders").doc(orderId);

    ref.get().then(doc=>{

        const data = doc.data();

        const dishes = data.dishes;

        //一度取り出す
        const item =
        dishes.splice(dragIndex,1)[0];

        //新しい位置へ挿入
        dishes.splice(dropIndex,0,item);

        ref.update({

            dishes:dishes

        });

        dragOrderId = null;
        dragIndex = null;

    });

}

//==================================================
// ドラッグ＆ドロップ（追加料理）
//==================================================

// ドラッグ中の注文ID
let dragExtraOrderId = null;

// ドラッグ中の追加料理番号
let dragExtraIndex = null;

//------------------------------
// ドラッグ開始
//------------------------------
function dragExtraDish(orderId,index){

    dragExtraOrderId = orderId;
    dragExtraIndex = index;

}

//------------------------------
// ドロップ
//------------------------------
function dropExtraDish(orderId,dropIndex){

    //違う注文には移動できない
    if(dragExtraOrderId !== orderId) return;

    if(dragExtraIndex === null) return;

    const ref =
    window.db.collection("orders").doc(orderId);

    ref.get().then(doc=>{

        const data = doc.data();

        const extra =
        data.extraDishes || [];

        //一度取り出す
        const item =
        extra.splice(dragExtraIndex,1)[0];

        //新しい位置へ挿入
        extra.splice(dropIndex,0,item);

        ref.update({

            extraDishes:extra

        });

        dragExtraOrderId = null;
        dragExtraIndex = null;

    });

}
//==================================================
// 完了コース一覧表示
//==================================================
function renderCompleted(snapshot){

    const body =
    document.getElementById("completedBody");

    body.innerHTML = "";

let html = "";

snapshot.docs.forEach(doc=>{

    const data = doc.data();

    html += `
        <tr>
            <td>${data.time}</td>
            <td>${data.course}</td>
            <td>${data.people}</td>
            <td>${data.table}</td>
            <td>${data.completedTime || ""}</td>
            <td>
                <button onclick="restoreOrder('${doc.id}')">
                    戻す
                </button>
            </td>
        </tr>
    `;

});

body.innerHTML = html;

}

//==================================================
// HTMLから呼び出す関数
//==================================================

window.logout = logout;

window.addCourse = addCourse;

window.deleteOrder = deleteOrder;

window.updateField = updateField;

window.updateCourse = updateCourse;

window.toggleDish = toggleDish;

window.toggleExtraDish = toggleExtraDish;

window.restoreOrder = restoreOrder;

window.addExtraDish = addExtraDish;

window.dragDish = dragDish;

window.dropDish = dropDish;

window.dragExtraDish = dragExtraDish;

window.dropExtraDish = dropExtraDish;

//==================================================
// 1秒ごとに進捗バー更新
//==================================================

setInterval(()=>{

    window.db

    .collection("orders")

    .get()

    .then(snapshot=>{

        snapshot.forEach(doc=>{

            const order = doc.data();

            const id = doc.id;

            const [hour,minute] =
            order.time.split(":");

            const now = new Date();

            const startMinutes =
            Number(hour)*60 + Number(minute);

            const nowMinutes =
            now.getHours()*60 +
            now.getMinutes();

            const duration =
            courseDuration[order.course] || 90;

            let progress =
            ((nowMinutes-startMinutes)/duration)*100;

            progress = Math.max(
                0,
                Math.min(progress,100)
            );

            const bar =
            document.getElementById(`progress-${id}`);

            if(bar){

                bar.style.width =
                progress + "%";

            }

        });

    });

},1000);

//==================================================
// 30秒ごとにL.O・色更新
//==================================================

setInterval(()=>{

    if(latestSnapshot){

        renderOrders(latestSnapshot);

    }

},30000);