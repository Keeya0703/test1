// ログイン情報（実際のアプリではサーバー側で管理します）
const users = JSON.parse(localStorage.getItem('users')) || [
    { username: 'admin', password: 'admin123', name: '管理者', isAdmin: true },
    { username: 'staff1', password: 'staff123', name: '職員1', isAdmin: false },
    { username: 'staff2', password: 'staff123', name: '職員2', isAdmin: false }
];

// 利用者情報を保存する配列（実際のアプリではデータベースを使います）
let patients = JSON.parse(localStorage.getItem('patients')) || [];

// 介護記録を保存する配列
let careRecords = JSON.parse(localStorage.getItem('careRecords')) || [];

// スケジュールを保存する配列
let schedules = JSON.parse(localStorage.getItem('schedules')) || [];

// 連絡事項を保存する配列
let messages = JSON.parse(localStorage.getItem('messages')) || [];

// 現在ログインしているユーザー
let currentUser = null;

// ページが読み込まれたときの処理
document.addEventListener('DOMContentLoaded', function() {
    // ログイン状態を確認
    const savedUser = sessionStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showPatientsPage();
    } else {
        showLoginPage();
    }
});

// ログインページを表示
function showLoginPage() {
    document.body.innerHTML = `
        <div class="container">
            <div class="login-box">
                <h1>介護施設管理アプリ</h1>
                <form id="loginForm">
                    <div class="form-group">
                        <label for="username">ユーザー名</label>
                        <input type="text" id="username" name="username" required>
                    </div>
                    <div class="form-group">
                        <label for="password">パスワード</label>
                        <input type="password" id="password" name="password" required>
                    </div>
                    <button type="submit" class="btn-primary">ログイン</button>
                    <p id="errorMessage" class="error-message"></p>
                </form>
            </div>
        </div>
    `;
    
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
}

// ログイン処理
function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        currentUser = user;
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        showPatientsPage();
    } else {
        const errorMsg = document.getElementById('errorMessage');
        errorMsg.textContent = 'ユーザー名またはパスワードが正しくありません';
        errorMsg.classList.add('show');
    }
}

// 利用者一覧ページを表示
function showPatientsPage() {
    document.body.innerHTML = `
        <div class="container">
            <div class="header">
                <h1>介護施設管理アプリ</h1>
                <div class="header-info">
                    <span>ログイン中: ${currentUser.name}</span>
                    <div class="header-buttons">
                        <button class="btn-small btn-success" onclick="showAddPatientForm()">新規登録</button>
                        <button class="btn-small" onclick="showSchedulesPage()" style="background-color: #9b59b6; color: white;">スケジュール</button>
                        <button class="btn-small" onclick="showMessagesPage()" style="background-color: #16a085; color: white;">連絡事項</button>
                        <button class="logout-btn" onclick="handleLogout()">ログアウト</button>
                    </div>
                </div>
            </div>
            <div id="patientsList" class="patients-list"></div>
        </div>
    `;
    
    displayPatients();
}

// 利用者一覧を表示
function displayPatients() {
    const listContainer = document.getElementById('patientsList');
    
    // 管理者は全員、一般職員は自分の担当利用者のみ表示
    let filteredPatients = patients;
    if (!currentUser.isAdmin) {
        filteredPatients = patients.filter(p => p.assignedStaff === currentUser.username);
    }
    
    if (filteredPatients.length === 0) {
        listContainer.innerHTML = '<p style="text-align: center; font-size: 18px; color: #999;">登録されている利用者はいません</p>';
        return;
    }
    
    // 元のインデックスを保持するために、フィルタリング前のインデックスを取得
    listContainer.innerHTML = filteredPatients.map((patient) => {
        const originalIndex = patients.findIndex(p => p === patient);
        return `
        <div class="patient-card">
            ${patient.photo ? `<img src="${patient.photo}" alt="写真" class="patient-photo">` : '<div class="patient-photo" style="background-color: #ddd; display: flex; align-items: center; justify-content: center; color: #999;">写真なし</div>'}
            <div class="patient-info">
                <h3>${patient.name}</h3>
                <p><strong>部屋番号:</strong> ${patient.roomNumber || '未設定'}</p>
                <p><strong>年齢:</strong> ${patient.age || '未設定'}歳</p>
                <p><strong>性別:</strong> ${patient.gender || '未設定'}</p>
                ${patient.careLevel ? `<p><strong>要介護度:</strong> ${patient.careLevel}</p>` : ''}
                ${patient.healthStatus ? `<p><strong>健康状態:</strong> ${patient.healthStatus}</p>` : ''}
                ${patient.medicalHistory ? `<p><strong>既往歴:</strong> ${patient.medicalHistory}</p>` : ''}
                ${patient.assignedStaff ? `<p><strong>担当職員:</strong> ${users.find(u => u.username === patient.assignedStaff)?.name || patient.assignedStaff}</p>` : ''}
            </div>
            <div class="patient-actions">
                <button class="btn btn-edit" onclick="showCareRecords(${originalIndex})">記録を見る</button>
                <button class="btn" onclick="addCareRecord(${originalIndex})" style="background-color: #3498db; color: white;">記録を追加</button>
                <button class="btn btn-edit" onclick="editPatient(${originalIndex})">編集</button>
                ${currentUser.isAdmin ? `<button class="btn btn-delete" onclick="deletePatient(${originalIndex})">削除</button>` : ''}
            </div>
        </div>
    `;
    }).join('');
}

// 利用者登録フォームを表示
function showAddPatientForm() {
    showPatientForm();
}

// 利用者編集フォームを表示
function editPatient(index) {
    showPatientForm(index);
}

// 利用者登録・編集フォームを表示
function showPatientForm(editIndex = null) {
    const patient = editIndex !== null ? patients[editIndex] : null;
    
    document.body.innerHTML = `
        <div class="container">
            <div class="header">
                <h1>介護施設管理アプリ</h1>
                <div class="header-info">
                    <span>ログイン中: ${currentUser.name}</span>
                    <button class="logout-btn" onclick="handleLogout()">ログアウト</button>
                </div>
            </div>
            <div class="form-container">
                <h2>${editIndex !== null ? '利用者情報を編集' : '新しい利用者を登録'}</h2>
                <form id="patientForm">
                    <div class="form-group">
                        <label for="name">名前 *</label>
                        <input type="text" id="name" name="name" value="${patient ? patient.name : ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="roomNumber">部屋番号</label>
                        <input type="text" id="roomNumber" name="roomNumber" value="${patient ? patient.roomNumber : ''}">
                    </div>
                    <div class="form-group">
                        <label for="age">年齢</label>
                        <input type="number" id="age" name="age" value="${patient ? patient.age : ''}" min="0">
                    </div>
                    <div class="form-group">
                        <label for="gender">性別</label>
                        <select id="gender" name="gender">
                            <option value="">選択してください</option>
                            <option value="男性" ${patient && patient.gender === '男性' ? 'selected' : ''}>男性</option>
                            <option value="女性" ${patient && patient.gender === '女性' ? 'selected' : ''}>女性</option>
                            <option value="その他" ${patient && patient.gender === 'その他' ? 'selected' : ''}>その他</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="careLevel">要介護度</label>
                        <select id="careLevel" name="careLevel">
                            <option value="">選択してください</option>
                            <option value="要支援1" ${patient && patient.careLevel === '要支援1' ? 'selected' : ''}>要支援1</option>
                            <option value="要支援2" ${patient && patient.careLevel === '要支援2' ? 'selected' : ''}>要支援2</option>
                            <option value="要介護1" ${patient && patient.careLevel === '要介護1' ? 'selected' : ''}>要介護1</option>
                            <option value="要介護2" ${patient && patient.careLevel === '要介護2' ? 'selected' : ''}>要介護2</option>
                            <option value="要介護3" ${patient && patient.careLevel === '要介護3' ? 'selected' : ''}>要介護3</option>
                            <option value="要介護4" ${patient && patient.careLevel === '要介護4' ? 'selected' : ''}>要介護4</option>
                            <option value="要介護5" ${patient && patient.careLevel === '要介護5' ? 'selected' : ''}>要介護5</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="healthStatus">健康状態</label>
                        <textarea id="healthStatus" name="healthStatus" rows="3">${patient ? patient.healthStatus : ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="medicalHistory">既往歴</label>
                        <textarea id="medicalHistory" name="medicalHistory" rows="3" placeholder="過去の病気や手術歴などを記入してください">${patient ? patient.medicalHistory : ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="assignedStaff">担当職員</label>
                        <select id="assignedStaff" name="assignedStaff">
                            <option value="">選択してください</option>
                            ${users.filter(u => !u.isAdmin).map(u => `
                                <option value="${u.username}" ${patient && patient.assignedStaff === u.username ? 'selected' : ''}>${u.name}</option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="photo">顔写真</label>
                        <input type="file" id="photo" name="photo" accept="image/*" onchange="previewPhoto(event)">
                        ${patient && patient.photo ? `<img src="${patient.photo}" alt="現在の写真" class="photo-preview">` : ''}
                        <div id="photoPreview"></div>
                    </div>
                    <div style="text-align: center; margin-top: 20px;">
                        <button type="submit" class="btn btn-success">${editIndex !== null ? '更新' : '登録'}</button>
                        <button type="button" class="btn" onclick="showPatientsPage()" style="background-color: #95a5a6; color: white;">キャンセル</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.getElementById('patientForm').addEventListener('submit', (e) => handlePatientSubmit(e, editIndex));
}

// 写真のプレビューを表示
function previewPhoto(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('photoPreview');
            preview.innerHTML = `<img src="${e.target.result}" alt="プレビュー" class="photo-preview">`;
        };
        reader.readAsDataURL(file);
    }
}

// 利用者情報の登録・更新処理
function handlePatientSubmit(e, editIndex) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const photoInput = document.getElementById('photo');
    
    const patientData = {
        name: document.getElementById('name').value,
        roomNumber: document.getElementById('roomNumber').value,
        age: document.getElementById('age').value,
        gender: document.getElementById('gender').value,
        careLevel: document.getElementById('careLevel').value,
        healthStatus: document.getElementById('healthStatus').value,
        medicalHistory: document.getElementById('medicalHistory').value,
        assignedStaff: document.getElementById('assignedStaff').value
    };
    
    // 写真の処理
    if (photoInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            patientData.photo = e.target.result;
            savePatient(patientData, editIndex);
        };
        reader.readAsDataURL(photoInput.files[0]);
    } else if (editIndex !== null && patients[editIndex].photo) {
        // 編集時で写真を変更しない場合は既存の写真を保持
        patientData.photo = patients[editIndex].photo;
        savePatient(patientData, editIndex);
    } else {
        savePatient(patientData, editIndex);
    }
}

// 利用者情報を保存
function savePatient(patientData, editIndex) {
    if (editIndex !== null) {
        patients[editIndex] = patientData;
    } else {
        patients.push(patientData);
    }
    
    localStorage.setItem('patients', JSON.stringify(patients));
    showPatientsPage();
}

// 利用者を削除
function deletePatient(index) {
    if (confirm('この利用者を削除してもよろしいですか？')) {
        patients.splice(index, 1);
        localStorage.setItem('patients', JSON.stringify(patients));
        showPatientsPage();
    }
}

// 記録の詳細をフォーマット
function formatRecordDetails(details) {
    if (!details) return '';
    
    let html = '<div class="record-details" style="margin-top: 10px; padding: 10px; background-color: #f0f0f0; border-radius: 4px;">';
    
    if (details.option) {
        // 排泄記録の詳細
        if (details.urine) {
            html += `<p style="margin: 5px 0;"><strong>尿:</strong> 方法: ${details.urine.method}、状態: ${details.urine.status}</p>`;
        }
        if (details.stool) {
            html += `<p style="margin: 5px 0;"><strong>便:</strong> 方法: ${details.stool.method}、状態: ${details.stool.status}、排便量: ${details.stool.amount}、便性状: ${details.stool.type}</p>`;
        }
    } else if (details.mealType) {
        // 食事記録の詳細
        html += `<p style="margin: 5px 0;"><strong>食事種類:</strong> ${details.mealType}</p>`;
        if (details.amount) {
            html += `<p style="margin: 5px 0;"><strong>摂取量:</strong> ${details.amount}</p>`;
        }
    }
    
    html += '</div>';
    return html;
}

// 介護記録を表示
function showCareRecords(patientIndex) {
    const patient = patients[patientIndex];
    const patientRecords = careRecords.filter(r => r.patientIndex === patientIndex)
        .sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time));
    
    // 今日の記録を取得
    const today = new Date().toISOString().split('T')[0];
    const todayRecords = patientRecords.filter(r => r.date === today);
    
    document.body.innerHTML = `
        <div class="container">
            <div class="header">
                <h1>${patient.name}さんの記録</h1>
                <div class="header-info">
                    <span>ログイン中: ${currentUser.name}</span>
                    <div class="header-buttons">
                        <button class="btn-small" onclick="addCareRecord(${patientIndex})" style="background-color: #3498db; color: white;">記録を追加</button>
                        <button class="btn-small" onclick="showPatientsPage()" style="background-color: #95a5a6; color: white;">一覧に戻る</button>
                        <button class="logout-btn" onclick="handleLogout()">ログアウト</button>
                    </div>
                </div>
            </div>
            <div class="care-records-container">
                <h2 style="margin-bottom: 20px; color: #2c3e50;">今日の様子（${today}）</h2>
                ${todayRecords.length === 0 ? '<p style="text-align: center; color: #999; padding: 20px;">今日の記録はまだありません</p>' : ''}
                <div class="records-list">
                    ${todayRecords.map((record, idx) => `
                        <div class="record-card">
                            <div class="record-header">
                                <span class="record-time">${record.time}</span>
                                <span class="record-staff">記録者: ${record.staffName}</span>
                            </div>
                            <div class="record-content">
                                <p><strong>種類:</strong> ${record.type}</p>
                                <p><strong>内容:</strong> ${record.content}</p>
                                ${record.details ? formatRecordDetails(record.details) : ''}
                                ${record.notes ? `<p><strong>備考:</strong> ${record.notes}</p>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
                <h2 style="margin-top: 30px; margin-bottom: 20px; color: #2c3e50;">過去の記録</h2>
                <div class="records-list">
                    ${patientRecords.filter(r => r.date !== today).map((record, idx) => `
                        <div class="record-card">
                            <div class="record-header">
                                <span class="record-date">${record.date} ${record.time}</span>
                                <span class="record-staff">記録者: ${record.staffName}</span>
                            </div>
                            <div class="record-content">
                                <p><strong>種類:</strong> ${record.type}</p>
                                <p><strong>内容:</strong> ${record.content}</p>
                                ${record.details ? formatRecordDetails(record.details) : ''}
                                ${record.notes ? `<p><strong>備考:</strong> ${record.notes}</p>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

// 介護記録を追加
function addCareRecord(patientIndex) {
    const patient = patients[patientIndex];
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);
    
    document.body.innerHTML = `
        <div class="container">
            <div class="header">
                <h1>介護記録を追加</h1>
                <div class="header-info">
                    <span>ログイン中: ${currentUser.name}</span>
                    <button class="logout-btn" onclick="handleLogout()">ログアウト</button>
                </div>
            </div>
            <div class="form-container">
                <h2>${patient.name}さんの記録</h2>
                <form id="careRecordForm">
                    <div class="form-group">
                        <label for="recordDate">日付 *</label>
                        <input type="date" id="recordDate" name="recordDate" value="${currentDate}" required>
                    </div>
                    <div class="form-group">
                        <label for="recordTime">時刻 *</label>
                        <input type="time" id="recordTime" name="recordTime" value="${currentTime}" required>
                    </div>
                    <div class="form-group">
                        <label>記録の種類 *</label>
                        <div class="record-type-buttons">
                            <button type="button" class="record-type-btn" onclick="selectRecordType('排泄', ${patientIndex})">排泄</button>
                            <button type="button" class="record-type-btn" onclick="selectRecordType('食事', ${patientIndex})">食事</button>
                            <button type="button" class="record-type-btn" onclick="selectRecordType('入浴', ${patientIndex})">入浴</button>
                            <button type="button" class="record-type-btn" onclick="selectRecordType('服薬', ${patientIndex})">服薬</button>
                            <button type="button" class="record-type-btn" onclick="selectRecordType('健康状態', ${patientIndex})">健康状態</button>
                            <button type="button" class="record-type-btn" onclick="selectRecordType('その他', ${patientIndex})">その他</button>
                        </div>
                    </div>
                    <div id="recordDetails"></div>
                    <div style="text-align: center; margin-top: 20px;">
                        <button type="button" class="btn" onclick="showCareRecords(${patientIndex})" style="background-color: #95a5a6; color: white;">キャンセル</button>
                    </div>
                </form>
            </div>
        </div>
    `;
}

// 記録の種類を選択
function selectRecordType(type, patientIndex) {
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);
    
    let detailsHTML = '';
    
    if (type === '排泄') {
        detailsHTML = `
            <div class="record-details-form">
                <h3 style="margin-bottom: 20px; color: #2c3e50;">排泄記録</h3>
                <div class="form-group">
                    <label>種類 *</label>
                    <div class="option-buttons">
                        <button type="button" class="option-btn" onclick="selectExcretionOption('urine', ${patientIndex})">尿</button>
                        <button type="button" class="option-btn" onclick="selectExcretionOption('stool', ${patientIndex})">便</button>
                        <button type="button" class="option-btn" onclick="selectExcretionOption('both', ${patientIndex})">両方</button>
                    </div>
                </div>
                <div id="excretionDetails"></div>
            </div>
        `;
    } else if (type === '食事') {
        detailsHTML = `
            <div class="record-details-form">
                <h3 style="margin-bottom: 20px; color: #2c3e50;">食事記録</h3>
                <div class="form-group">
                    <label>食事の種類 *</label>
                    <div class="option-buttons">
                        <button type="button" class="option-btn" onclick="selectMealType('朝食', ${patientIndex})">朝食</button>
                        <button type="button" class="option-btn" onclick="selectMealType('昼食', ${patientIndex})">昼食</button>
                        <button type="button" class="option-btn" onclick="selectMealType('夕食', ${patientIndex})">夕食</button>
                        <button type="button" class="option-btn" onclick="selectMealType('間食', ${patientIndex})">間食</button>
                        <button type="button" class="option-btn" onclick="selectMealType('水分', ${patientIndex})">水分</button>
                    </div>
                </div>
                <div id="mealDetails"></div>
            </div>
        `;
    } else {
        // その他の記録タイプ
        detailsHTML = `
            <div class="record-details-form">
                <h3 style="margin-bottom: 20px; color: #2c3e50;">${type}記録</h3>
                <div class="form-group">
                    <label for="recordContent">内容 *</label>
                    <textarea id="recordContent" name="recordContent" rows="4" required placeholder="具体的な内容を記入してください"></textarea>
                </div>
                <div class="form-group">
                    <label for="recordNotes">備考</label>
                    <textarea id="recordNotes" name="recordNotes" rows="3" placeholder="特記事項があれば記入してください"></textarea>
                </div>
                <div style="text-align: center; margin-top: 20px;">
                    <button type="button" class="btn btn-success" onclick="saveOtherRecord('${type}', ${patientIndex})">記録を保存</button>
                </div>
            </div>
        `;
    }
    
    document.getElementById('recordDetails').innerHTML = detailsHTML;
}

// 排泄の詳細選択
function selectExcretionOption(option, patientIndex) {
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);
    
    let detailsHTML = '';
    
    if (option === 'urine' || option === 'both') {
        detailsHTML += `
            <div class="excretion-section">
                <h4 style="margin: 20px 0 10px 0; color: #34495e;">尿の記録</h4>
                <div class="form-group">
                    <label>排泄方法 *</label>
                    <div class="option-buttons">
                        <button type="button" class="option-btn" data-urine-method="おむつ" onclick="setUrineMethod('おむつ')">おむつ</button>
                        <button type="button" class="option-btn" data-urine-method="パッド" onclick="setUrineMethod('パッド')">パッド</button>
                        <button type="button" class="option-btn" data-urine-method="トイレ" onclick="setUrineMethod('トイレ')">トイレ</button>
                        <button type="button" class="option-btn" data-urine-method="ポータブル" onclick="setUrineMethod('ポータブル')">ポータブル</button>
                    </div>
                </div>
                <div class="form-group">
                    <label>状態 *</label>
                    <div class="option-buttons">
                        <button type="button" class="option-btn" data-urine-status="失禁" onclick="setUrineStatus('失禁')">失禁</button>
                        <button type="button" class="option-btn" data-urine-status="自己申告" onclick="setUrineStatus('自己申告')">自己申告</button>
                    </div>
                </div>
            </div>
        `;
    }
    
    if (option === 'stool' || option === 'both') {
        detailsHTML += `
            <div class="excretion-section">
                <h4 style="margin: 20px 0 10px 0; color: #34495e;">便の記録</h4>
                <div class="form-group">
                    <label>排泄方法 *</label>
                    <div class="option-buttons">
                        <button type="button" class="option-btn" data-stool-method="おむつ" onclick="setStoolMethod('おむつ')">おむつ</button>
                        <button type="button" class="option-btn" data-stool-method="パッド" onclick="setStoolMethod('パッド')">パッド</button>
                        <button type="button" class="option-btn" data-stool-method="トイレ" onclick="setStoolMethod('トイレ')">トイレ</button>
                        <button type="button" class="option-btn" data-stool-method="ポータブル" onclick="setStoolMethod('ポータブル')">ポータブル</button>
                    </div>
                </div>
                <div class="form-group">
                    <label>状態 *</label>
                    <div class="option-buttons">
                        <button type="button" class="option-btn" data-stool-status="失禁" onclick="setStoolStatus('失禁')">失禁</button>
                        <button type="button" class="option-btn" data-stool-status="自己申告" onclick="setStoolStatus('自己申告')">自己申告</button>
                    </div>
                </div>
                <div class="form-group">
                    <label>排便量 *</label>
                    <div class="option-buttons">
                        <button type="button" class="option-btn" data-stool-amount="付着" onclick="setStoolAmount('付着')">付着</button>
                        <button type="button" class="option-btn" data-stool-amount="1割" onclick="setStoolAmount('1割')">1割</button>
                        <button type="button" class="option-btn" data-stool-amount="2割" onclick="setStoolAmount('2割')">2割</button>
                        <button type="button" class="option-btn" data-stool-amount="3割" onclick="setStoolAmount('3割')">3割</button>
                        <button type="button" class="option-btn" data-stool-amount="4割" onclick="setStoolAmount('4割')">4割</button>
                        <button type="button" class="option-btn" data-stool-amount="5割" onclick="setStoolAmount('5割')">5割</button>
                        <button type="button" class="option-btn" data-stool-amount="6割" onclick="setStoolAmount('6割')">6割</button>
                        <button type="button" class="option-btn" data-stool-amount="7割" onclick="setStoolAmount('7割')">7割</button>
                        <button type="button" class="option-btn" data-stool-amount="8割" onclick="setStoolAmount('8割')">8割</button>
                        <button type="button" class="option-btn" data-stool-amount="9割" onclick="setStoolAmount('9割')">9割</button>
                        <button type="button" class="option-btn" data-stool-amount="10割" onclick="setStoolAmount('10割')">10割</button>
                    </div>
                </div>
                <div class="form-group">
                    <label>便性状（ブリストルスケール） *</label>
                    <div class="option-buttons">
                        <button type="button" class="option-btn" data-stool-type="1型" onclick="setStoolType('1型')" title="コロコロ便（硬い便）">1型</button>
                        <button type="button" class="option-btn" data-stool-type="2型" onclick="setStoolType('2型')" title="硬い便（塊状）">2型</button>
                        <button type="button" class="option-btn" data-stool-type="3型" onclick="setStoolType('3型')" title="やや硬い便（表面にひび割れ）">3型</button>
                        <button type="button" class="option-btn" data-stool-type="4型" onclick="setStoolType('4型')" title="普通便（表面が滑らか）">4型</button>
                        <button type="button" class="option-btn" data-stool-type="5型" onclick="setStoolType('5型')" title="やや軟らかい便（はっきりした切れ端）">5型</button>
                        <button type="button" class="option-btn" data-stool-type="6型" onclick="setStoolType('6型')" title="泥状便">6型</button>
                        <button type="button" class="option-btn" data-stool-type="7型" onclick="setStoolType('7型')" title="水様便">7型</button>
                    </div>
                </div>
            </div>
        `;
    }
    
    detailsHTML += `
        <div style="text-align: center; margin-top: 30px;">
            <button type="button" class="btn btn-success" onclick="saveExcretionRecord('${option}', ${patientIndex})">記録を保存</button>
        </div>
    `;
    
    document.getElementById('excretionDetails').innerHTML = detailsHTML;
}

// グローバル変数で選択値を保持
let excretionData = {
    urineMethod: '',
    urineStatus: '',
    stoolMethod: '',
    stoolStatus: '',
    stoolAmount: '',
    stoolType: ''
};

function setUrineMethod(method) {
    excretionData.urineMethod = method;
    document.querySelectorAll('[data-urine-method]').forEach(btn => {
        btn.classList.remove('selected');
        if (btn.textContent === method) btn.classList.add('selected');
    });
}

function setUrineStatus(status) {
    excretionData.urineStatus = status;
    document.querySelectorAll('[data-urine-status]').forEach(btn => {
        btn.classList.remove('selected');
        if (btn.textContent === status) btn.classList.add('selected');
    });
}

function setStoolMethod(method) {
    excretionData.stoolMethod = method;
    document.querySelectorAll('[data-stool-method]').forEach(btn => {
        btn.classList.remove('selected');
        if (btn.textContent === method) btn.classList.add('selected');
    });
}

function setStoolStatus(status) {
    excretionData.stoolStatus = status;
    document.querySelectorAll('[data-stool-status]').forEach(btn => {
        btn.classList.remove('selected');
        if (btn.textContent === status) btn.classList.add('selected');
    });
}

function setStoolAmount(amount) {
    excretionData.stoolAmount = amount;
    document.querySelectorAll('[data-stool-amount]').forEach(btn => {
        btn.classList.remove('selected');
        if (btn.textContent === amount) btn.classList.add('selected');
    });
}

function setStoolType(type) {
    excretionData.stoolType = type;
    document.querySelectorAll('[data-stool-type]').forEach(btn => {
        btn.classList.remove('selected');
        if (btn.textContent === type) btn.classList.add('selected');
    });
}

// 排泄記録を保存
function saveExcretionRecord(option, patientIndex) {
    const date = document.getElementById('recordDate').value;
    const time = document.getElementById('recordTime').value;
    
    let content = '';
    let details = [];
    
    if (option === 'urine' || option === 'both') {
        if (!excretionData.urineMethod || !excretionData.urineStatus) {
            alert('尿の記録をすべて入力してください');
            return;
        }
        details.push(`尿: ${excretionData.urineMethod}、${excretionData.urineStatus}`);
    }
    
    if (option === 'stool' || option === 'both') {
        if (!excretionData.stoolMethod || !excretionData.stoolStatus || !excretionData.stoolAmount || !excretionData.stoolType) {
            alert('便の記録をすべて入力してください');
            return;
        }
        details.push(`便: ${excretionData.stoolMethod}、${excretionData.stoolStatus}、排便量${excretionData.stoolAmount}、${excretionData.stoolType}`);
    }
    
    content = details.join(' / ');
    
    const recordData = {
        patientIndex: patientIndex,
        date: date,
        time: time,
        type: '排泄',
        content: content,
        details: {
            option: option,
            urine: option === 'urine' || option === 'both' ? {
                method: excretionData.urineMethod,
                status: excretionData.urineStatus
            } : null,
            stool: option === 'stool' || option === 'both' ? {
                method: excretionData.stoolMethod,
                status: excretionData.stoolStatus,
                amount: excretionData.stoolAmount,
                type: excretionData.stoolType
            } : null
        },
        staffName: currentUser.name,
        staffUsername: currentUser.username
    };
    
    careRecords.push(recordData);
    localStorage.setItem('careRecords', JSON.stringify(careRecords));
    
    // データをリセット
    excretionData = {
        urineMethod: '',
        urineStatus: '',
        stoolMethod: '',
        stoolStatus: '',
        stoolAmount: '',
        stoolType: ''
    };
    
    showCareRecords(patientIndex);
}

// 食事の種類を選択
function selectMealType(mealType, patientIndex) {
    // 食事の詳細入力フォームを表示
    // まずは基本的な実装
    const date = document.getElementById('recordDate').value;
    const time = document.getElementById('recordTime').value;
    
    let detailsHTML = `
        <div class="record-details-form">
            <h4 style="margin: 20px 0 10px 0; color: #34495e;">${mealType}の記録</h4>
            <div class="form-group">
                <label for="mealContent">内容 *</label>
                <textarea id="mealContent" name="mealContent" rows="4" required placeholder="食べた内容を記入してください"></textarea>
            </div>
            <div class="form-group">
                <label for="mealAmount">摂取量</label>
                <div class="option-buttons">
                    <button type="button" class="option-btn" onclick="setMealAmount('全量')">全量</button>
                    <button type="button" class="option-btn" onclick="setMealAmount('8割')">8割</button>
                    <button type="button" class="option-btn" onclick="setMealAmount('5割')">5割</button>
                    <button type="button" class="option-btn" onclick="setMealAmount('3割')">3割</button>
                    <button type="button" class="option-btn" onclick="setMealAmount('1割')">1割</button>
                    <button type="button" class="option-btn" onclick="setMealAmount('摂取なし')">摂取なし</button>
                </div>
            </div>
            <div style="text-align: center; margin-top: 20px;">
                <button type="button" class="btn btn-success" onclick="saveMealRecord('${mealType}', ${patientIndex})">記録を保存</button>
            </div>
        </div>
    `;
    
    document.getElementById('mealDetails').innerHTML = detailsHTML;
}

let mealAmount = '';

function setMealAmount(amount) {
    mealAmount = amount;
    document.querySelectorAll('[onclick^="setMealAmount"]').forEach(btn => {
        btn.classList.remove('selected');
        if (btn.textContent === amount) btn.classList.add('selected');
    });
}

// 食事記録を保存
function saveMealRecord(mealType, patientIndex) {
    const date = document.getElementById('recordDate').value;
    const time = document.getElementById('recordTime').value;
    const content = document.getElementById('mealContent').value;
    
    if (!content) {
        alert('内容を入力してください');
        return;
    }
    
    let fullContent = `${mealType}: ${content}`;
    if (mealAmount) {
        fullContent += `（摂取量: ${mealAmount}）`;
    }
    
    const recordData = {
        patientIndex: patientIndex,
        date: date,
        time: time,
        type: '食事',
        content: fullContent,
        details: {
            mealType: mealType,
            content: content,
            amount: mealAmount
        },
        staffName: currentUser.name,
        staffUsername: currentUser.username
    };
    
    careRecords.push(recordData);
    localStorage.setItem('careRecords', JSON.stringify(careRecords));
    
    mealAmount = '';
    showCareRecords(patientIndex);
}

// その他の記録を保存
function saveOtherRecord(type, patientIndex) {
    const date = document.getElementById('recordDate').value;
    const time = document.getElementById('recordTime').value;
    const content = document.getElementById('recordContent').value;
    const notes = document.getElementById('recordNotes').value;
    
    if (!content) {
        alert('内容を入力してください');
        return;
    }
    
    const recordData = {
        patientIndex: patientIndex,
        date: date,
        time: time,
        type: type,
        content: content,
        notes: notes,
        staffName: currentUser.name,
        staffUsername: currentUser.username
    };
    
    careRecords.push(recordData);
    localStorage.setItem('careRecords', JSON.stringify(careRecords));
    showCareRecords(patientIndex);
}

// スケジュールページを表示
function showSchedulesPage() {
    const allSchedules = schedules.sort((a, b) => new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time));
    
    document.body.innerHTML = `
        <div class="container">
            <div class="header">
                <h1>スケジュール管理</h1>
                <div class="header-info">
                    <span>ログイン中: ${currentUser.name}</span>
                    <div class="header-buttons">
                        <button class="btn-small btn-success" onclick="addSchedule()">スケジュール追加</button>
                        <button class="btn-small" onclick="showPatientsPage()" style="background-color: #95a5a6; color: white;">利用者一覧</button>
                        <button class="logout-btn" onclick="handleLogout()">ログアウト</button>
                    </div>
                </div>
            </div>
            <div class="schedules-container">
                <div id="schedulesList" class="schedules-list"></div>
            </div>
        </div>
    `;
    
    displaySchedules();
}

// スケジュールを表示
function displaySchedules() {
    const listContainer = document.getElementById('schedulesList');
    const allSchedules = schedules.sort((a, b) => new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time));
    
    if (allSchedules.length === 0) {
        listContainer.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">スケジュールはまだありません</p>';
        return;
    }
    
    listContainer.innerHTML = allSchedules.map((schedule, index) => `
        <div class="schedule-card">
            <div class="schedule-header">
                <span class="schedule-date">${schedule.date} ${schedule.time}</span>
                ${schedule.patientName ? `<span class="schedule-patient">利用者: ${schedule.patientName}</span>` : ''}
            </div>
            <div class="schedule-content">
                <h3>${schedule.title}</h3>
                <p>${schedule.description || ''}</p>
                <p><strong>作成者:</strong> ${schedule.createdBy}</p>
            </div>
            <div class="schedule-actions">
                <button class="btn btn-edit" onclick="editSchedule(${index})">編集</button>
                <button class="btn btn-delete" onclick="deleteSchedule(${index})">削除</button>
            </div>
        </div>
    `).join('');
}

// スケジュールを追加
function addSchedule() {
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);
    
    document.body.innerHTML = `
        <div class="container">
            <div class="header">
                <h1>スケジュールを追加</h1>
                <div class="header-info">
                    <span>ログイン中: ${currentUser.name}</span>
                    <button class="logout-btn" onclick="handleLogout()">ログアウト</button>
                </div>
            </div>
            <div class="form-container">
                <form id="scheduleForm">
                    <div class="form-group">
                        <label for="scheduleDate">日付 *</label>
                        <input type="date" id="scheduleDate" name="scheduleDate" value="${currentDate}" required>
                    </div>
                    <div class="form-group">
                        <label for="scheduleTime">時刻 *</label>
                        <input type="time" id="scheduleTime" name="scheduleTime" value="${currentTime}" required>
                    </div>
                    <div class="form-group">
                        <label for="scheduleTitle">タイトル *</label>
                        <input type="text" id="scheduleTitle" name="scheduleTitle" required>
                    </div>
                    <div class="form-group">
                        <label for="schedulePatient">利用者（任意）</label>
                        <select id="schedulePatient" name="schedulePatient">
                            <option value="">選択してください</option>
                            ${patients.map(p => `<option value="${p.name}">${p.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="scheduleDescription">詳細</label>
                        <textarea id="scheduleDescription" name="scheduleDescription" rows="4"></textarea>
                    </div>
                    <div style="text-align: center; margin-top: 20px;">
                        <button type="submit" class="btn btn-success">保存</button>
                        <button type="button" class="btn" onclick="showSchedulesPage()" style="background-color: #95a5a6; color: white;">キャンセル</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.getElementById('scheduleForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const scheduleData = {
            date: document.getElementById('scheduleDate').value,
            time: document.getElementById('scheduleTime').value,
            title: document.getElementById('scheduleTitle').value,
            patientName: document.getElementById('schedulePatient').value,
            description: document.getElementById('scheduleDescription').value,
            createdBy: currentUser.name
        };
        schedules.push(scheduleData);
        localStorage.setItem('schedules', JSON.stringify(schedules));
        showSchedulesPage();
    });
}

// スケジュールを編集
function editSchedule(index) {
    const schedule = schedules[index];
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);
    
    document.body.innerHTML = `
        <div class="container">
            <div class="header">
                <h1>スケジュールを編集</h1>
                <div class="header-info">
                    <span>ログイン中: ${currentUser.name}</span>
                    <button class="logout-btn" onclick="handleLogout()">ログアウト</button>
                </div>
            </div>
            <div class="form-container">
                <form id="scheduleForm">
                    <div class="form-group">
                        <label for="scheduleDate">日付 *</label>
                        <input type="date" id="scheduleDate" name="scheduleDate" value="${schedule.date}" required>
                    </div>
                    <div class="form-group">
                        <label for="scheduleTime">時刻 *</label>
                        <input type="time" id="scheduleTime" name="scheduleTime" value="${schedule.time}" required>
                    </div>
                    <div class="form-group">
                        <label for="scheduleTitle">タイトル *</label>
                        <input type="text" id="scheduleTitle" name="scheduleTitle" value="${schedule.title}" required>
                    </div>
                    <div class="form-group">
                        <label for="schedulePatient">利用者（任意）</label>
                        <select id="schedulePatient" name="schedulePatient">
                            <option value="">選択してください</option>
                            ${patients.map(p => `<option value="${p.name}" ${schedule.patientName === p.name ? 'selected' : ''}>${p.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="scheduleDescription">詳細</label>
                        <textarea id="scheduleDescription" name="scheduleDescription" rows="4">${schedule.description || ''}</textarea>
                    </div>
                    <div style="text-align: center; margin-top: 20px;">
                        <button type="submit" class="btn btn-success">更新</button>
                        <button type="button" class="btn" onclick="showSchedulesPage()" style="background-color: #95a5a6; color: white;">キャンセル</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.getElementById('scheduleForm').addEventListener('submit', (e) => {
        e.preventDefault();
        schedules[index] = {
            date: document.getElementById('scheduleDate').value,
            time: document.getElementById('scheduleTime').value,
            title: document.getElementById('scheduleTitle').value,
            patientName: document.getElementById('schedulePatient').value,
            description: document.getElementById('scheduleDescription').value,
            createdBy: schedules[index].createdBy || currentUser.name
        };
        localStorage.setItem('schedules', JSON.stringify(schedules));
        showSchedulesPage();
    });
}

// スケジュールを削除
function deleteSchedule(index) {
    if (confirm('このスケジュールを削除してもよろしいですか？')) {
        schedules.splice(index, 1);
        localStorage.setItem('schedules', JSON.stringify(schedules));
        showSchedulesPage();
    }
}

// 連絡事項ページを表示
function showMessagesPage() {
    const allMessages = messages.sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time));
    
    document.body.innerHTML = `
        <div class="container">
            <div class="header">
                <h1>連絡事項</h1>
                <div class="header-info">
                    <span>ログイン中: ${currentUser.name}</span>
                    <div class="header-buttons">
                        <button class="btn-small btn-success" onclick="addMessage()">連絡事項を追加</button>
                        <button class="btn-small" onclick="showPatientsPage()" style="background-color: #95a5a6; color: white;">利用者一覧</button>
                        <button class="logout-btn" onclick="handleLogout()">ログアウト</button>
                    </div>
                </div>
            </div>
            <div class="messages-container">
                <div id="messagesList" class="messages-list"></div>
            </div>
        </div>
    `;
    
    displayMessages();
}

// 連絡事項を表示
function displayMessages() {
    const listContainer = document.getElementById('messagesList');
    const allMessages = messages.sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time));
    
    if (allMessages.length === 0) {
        listContainer.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">連絡事項はまだありません</p>';
        return;
    }
    
    listContainer.innerHTML = allMessages.map((message, index) => `
        <div class="message-card">
            <div class="message-header">
                <span class="message-date">${message.date} ${message.time}</span>
                <span class="message-author">投稿者: ${message.author}</span>
            </div>
            <div class="message-content">
                <h3>${message.title}</h3>
                <p>${message.content}</p>
            </div>
            <div class="message-actions">
                <button class="btn btn-edit" onclick="editMessage(${index})">編集</button>
                <button class="btn btn-delete" onclick="deleteMessage(${index})">削除</button>
            </div>
        </div>
    `).join('');
}

// 連絡事項を追加
function addMessage() {
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);
    
    document.body.innerHTML = `
        <div class="container">
            <div class="header">
                <h1>連絡事項を追加</h1>
                <div class="header-info">
                    <span>ログイン中: ${currentUser.name}</span>
                    <button class="logout-btn" onclick="handleLogout()">ログアウト</button>
                </div>
            </div>
            <div class="form-container">
                <form id="messageForm">
                    <div class="form-group">
                        <label for="messageTitle">タイトル *</label>
                        <input type="text" id="messageTitle" name="messageTitle" required>
                    </div>
                    <div class="form-group">
                        <label for="messageContent">内容 *</label>
                        <textarea id="messageContent" name="messageContent" rows="6" required></textarea>
                    </div>
                    <div style="text-align: center; margin-top: 20px;">
                        <button type="submit" class="btn btn-success">投稿</button>
                        <button type="button" class="btn" onclick="showMessagesPage()" style="background-color: #95a5a6; color: white;">キャンセル</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.getElementById('messageForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const now = new Date();
        const messageData = {
            date: now.toISOString().split('T')[0],
            time: now.toTimeString().split(' ')[0].substring(0, 5),
            title: document.getElementById('messageTitle').value,
            content: document.getElementById('messageContent').value,
            author: currentUser.name
        };
        messages.push(messageData);
        localStorage.setItem('messages', JSON.stringify(messages));
        showMessagesPage();
    });
}

// 連絡事項を編集
function editMessage(index) {
    const message = messages[index];
    
    document.body.innerHTML = `
        <div class="container">
            <div class="header">
                <h1>連絡事項を編集</h1>
                <div class="header-info">
                    <span>ログイン中: ${currentUser.name}</span>
                    <button class="logout-btn" onclick="handleLogout()">ログアウト</button>
                </div>
            </div>
            <div class="form-container">
                <form id="messageForm">
                    <div class="form-group">
                        <label for="messageTitle">タイトル *</label>
                        <input type="text" id="messageTitle" name="messageTitle" value="${message.title}" required>
                    </div>
                    <div class="form-group">
                        <label for="messageContent">内容 *</label>
                        <textarea id="messageContent" name="messageContent" rows="6" required>${message.content}</textarea>
                    </div>
                    <div style="text-align: center; margin-top: 20px;">
                        <button type="submit" class="btn btn-success">更新</button>
                        <button type="button" class="btn" onclick="showMessagesPage()" style="background-color: #95a5a6; color: white;">キャンセル</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.getElementById('messageForm').addEventListener('submit', (e) => {
        e.preventDefault();
        messages[index] = {
            ...message,
            title: document.getElementById('messageTitle').value,
            content: document.getElementById('messageContent').value
        };
        localStorage.setItem('messages', JSON.stringify(messages));
        showMessagesPage();
    });
}

// 連絡事項を削除
function deleteMessage(index) {
    if (confirm('この連絡事項を削除してもよろしいですか？')) {
        messages.splice(index, 1);
        localStorage.setItem('messages', JSON.stringify(messages));
        showMessagesPage();
    }
}

// ログアウト処理
function handleLogout() {
    sessionStorage.removeItem('currentUser');
    currentUser = null;
    showLoginPage();
}
