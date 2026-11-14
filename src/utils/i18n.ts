import { AppLanguage } from '../types';

export const TRANSLATIONS: Record<
  AppLanguage,
  {
    // Header & Tooltips
    appTitle: string;
    nodeLabel: string;
    switchEngineTooltip: string;
    switchThemeTooltip: string;
    themeKernelBtn: string;
    themeIdeBtn: string;
    watchBufBtn: string;
    watchBufTooltip: string;
    handoffBtn: string;
    handoffTooltip: string;
    syncBtn: string;
    syncingStatus: string;
    syncOkStatus: string;
    syncUnconfiguredBadge: string;
    syncErrorBadge: string;
    syncTooltip: string;
    settingsTooltip: string;
    cornerBtn: string;
    cornerTooltip: string;
    langTooltip: string;

    // Sidebar
    reposTitle: string;
    mountBtn: string;
    mountTooltip: string;
    msgsCount: string;
    sessionsTreeLabel: string;
    newChatSessionBtn: string;
    newChatSessionTooltip: string;
    renameSessionTooltip: string;
    deleteSessionTooltip: string;
    sessionDefaultPrefix: string;
    handoffSummaryTitle: string;
    editHandoffTooltip: string;
    newSesBtn: string;
    newSesTooltip: string;
    goalLabel: string;
    nextStepsShortLabel: string;
    localSesActive: string;
    freshHandoffMode: string;
    turnsSuffix: string;
    readyForHandoff: string;
    newHandoffPreparedStatus: string;

    // Cipher, Attachments & Input Bar
    cipherMaskOn: string;
    cipherMaskOff: string;
    maskRust: string;
    maskCpp: string;
    maskAsm: string;
    modelPrefix: string;
    modelSelectTooltip: string;
    effortPrefix: string;
    effortLow: string;
    effortMedium: string;
    effortHigh: string;
    effortXhigh: string;
    effortMax: string;
    effortSelectTooltip: string;
    autoPermitOn: string;
    autoPermitOff: string;
    autoPermitTooltip: string;
    attachBtn: string;
    attachBtnTooltip: string;
    pasteOrDropHint: string;
    removeAttachmentTooltip: string;
    attachmentsCountLabel: string;
    defaultAttachmentPrompt: string;
    altHeldNotice: string;
    inputHint: string;
    bufLenLabel: string;
    disguisedPlaceholder: string;
    statusLabel: string;
    defaultStatusIdle: string;
    syncedToPrefix: string;
    syncUnconfiguredDetail: string;
    syncErrorDetail: string;
    execSyscallBtn: string;
    sigintBtn: string;
    toggleDisguiseMsgTooltip: string;
    msgRealBadge: string;
    msgMaskedBadge: string;
    decodedRealMsgHeader: string;
    effortBadgePrefix: string;
    streamChannelLabel: string;
    agentStatusLabels: Record<string, string>;

    // Peek Inspector Window (WATCH_BUF)
    peekWindowTitle: string;
    closeInspectorTooltip: string;
    colSymbol: string;
    colType: string;
    colValue: string;
    symRawInputBuf: string;
    typeUtf8Str: string;
    symCipherLen: string;
    typeUsize: string;
    symAttachments: string;
    typeDmaList: string;
    nullTerminatedEmpty: string;
    charsUnit: string;
    peekInspectorAllMsgsLabel: string;
    peekInspectorLastReplyLabel: string;
    roleUser: string;
    roleAssistant: string;
    roleSystem: string;
    verificationSynced: string;
    holdAltFooterHint: string;
    peekInputPlaceholder: string;
    peekEnterNewlineModeOn: string;
    peekEnterNewlineModeOff: string;
    peekInsertNewlineBtn: string;
    peekSendBtn: string;
    peekAltMaskHint: string;
    peekAltMaskedActive: string;
    peekOpacityLabel: string;
    peekConfirmSendTitle: string;
    peekConfirmSendDesc: string;
    peekConfirmSendBtn: string;
    peekConfirmCancelBtn: string;
    mainConfirmSendTitle: string;
    mainConfirmSendDesc: string;
    mainConfirmSendBtn: string;
    mainConfirmCancelBtn: string;

    // Handoff Modal
    handoffModalTitle: string;
    escCloseLabel: string;
    handoffHowItWorksTitle: string;
    handoffHowItWorksDesc: (turns: number) => string;
    currentMachineSessionLabel: string;
    sessionActiveSuffix: string;
    freshSessionPending: string;
    fieldCurrentGoal: string;
    fieldCurrentGoalPlaceholder: string;
    fieldRecentProgress: string;
    fieldRecentProgressPlaceholder: string;
    fieldTouchedFiles: string;
    fieldTouchedFilesPlaceholder: string;
    fieldNextSteps: string;
    fieldNextStepsPlaceholder: string;
    resetAndLoadHandoffBtn: string;
    resetAndLoadHandoffTooltip: string;
    closeBtn: string;
    saveHandoffBtn: string;

    // AI Workspace Standard
    standardAiBadgeOk: string;
    standardAiBadgeWarning: string;
    scaffoldStandardBtn: string;
    scaffoldingStandardInProgress: string;
    scaffoldStandardSuccess: string;
    diskHandoffLinked: string;
    openLatestHandoffBtn: string;
    reloadFromDiskBtn: string;
    openDecisionsBtn: string;
    openTasksBtn: string;
    openDocsBtn: string;
    missingStandardComponents: (missing: string[]) => string;

    // Super Admin Login Modal
    adminLoginModalTitle: string;
    adminLoginSubtitle: string;
    adminUsernameLabel: string;
    adminPasswordLabel: string;
    adminPasswordPlaceholder: string;
    adminDefaultHint: string;
    adminLoginBtn: string;
    adminVerifyingBtn: string;
    adminInvalidCredentials: string;

    // Settings & Sync Modal
    settingsModalTitle: string;
    sec1Title: string;
    uiLanguageLabel: string;
    langOptionVi: string;
    langOptionEn: string;
    continuityStrategyLabel: string;
    strategySmartHandoff: string;
    strategyAlwaysHandoff: string;
    recentTurnsCountLabel: string;
    claudeCliPathLabel: string;
    defaultActiveEngineLabel: string;
    activeModelForEngineLabel: string;
    modelCustomOption: string;
    customModelPlaceholder: string;
    winMinimize: string;
    winMaximize: string;
    winRestore: string;
    winClose: string;
    claudeModelLabel: string;
    deepseekModelLabel: string;
    codexModelLabel: string;
    engineDescClaude: string;
    engineDescAgy: string;
    engineDescDeepseek: string;
    engineDescCodex: string;
    antigravityCliPathLabel: string;
    antigravityModelLabel: string;
    deepseekApiKeyLabel: string;
    codexApiKeyLabel: string;
    engineScannerTitle: string;
    engineScanBtn: string;
    engineScanningBtn: string;
    engineStatusFound: string;
    engineStatusMissing: string;
    engineAuthOk: string;
    engineAuthMissing: string;
    engineLoginBtn: string;
    engineManualBrowseBtn: string;
    engineManualBrowseHint: string;
    engineWarningBanner: string;
    engineLoginModalTitle: string;
    engineLoginModalSubtitle: string;
    engineLoginCliSectionTitle: string;
    engineLoginCliBtn: string;
    engineLoginRecheckBtn: string;
    engineLoginKeySectionTitle: string;
    engineLoginSaveKeyBtn: string;
    sec2Title: string;
    transportChannelLabel: string;
    transportBoth: string;
    transportFolder: string;
    transportGitRepo: string;
    transportGdriveApi: string;
    syncFolderLabel: string;
    syncFolderPlaceholder: string;
    browseBtn: string;
    gdriveFolderNameLabel: string;
    gdriveFolderIdLabel: string;
    gdriveAuthMethodLabel: string;
    gdriveAuthOptionToken: string;
    gdriveAuthOptionBrowser: string;
    gdriveAuthOptionSa: string;
    gdriveTokenLabel: string;
    gdriveTokenPlaceholder: string;
    gdriveGetPlaygroundTokenBtn: string;
    gdriveClientIdLabel: string;
    gdriveClientSecretLabel: string;
    gdriveConnectedEmailStatus: (email: string) => string;
    gdriveAutoRefreshHint: string;
    gdriveSignInBrowserBtn: string;
    gdriveServiceAccountLabel: string;
    gdrivePickSaFileBtn: string;
    gdriveSaNote: string;
    gdriveTestAndCreateFolderBtn: string;
    gdriveTestingBtn: string;
    gdriveOpenWebFolderBtn: string;
    gdriveSaLoadedMsg: (email: string) => string;
    gdriveTestingProgressMsg: string;
    gdriveTestSuccessMsg: (
      count: number,
      folderName: string,
      email: string,
      folderId: string
    ) => string;
    gdriveTestFailMsg: string;
    gdriveOAuthBrowserWaitMsg: string;
    gdriveOAuthSuccessMsg: (email: string, count: number, folderName: string) => string;
    gdriveOAuthFailMsg: string;
    aesPassphraseLabel: string;
    aesPlaceholder: string;
    sec3Title: string;
    autoStartCheckbox: string;
    alwaysOnTopCheckbox: string;
    autoSyncCheckbox: string;
    hotkeysSectionTitle: string;
    hotkeysSectionDesc: string;
    hotkeyHoldPeekLabel: string;
    hotkeyToggleAppLabel: string;
    hotkeyToggleWidgetLabel: string;
    hotkeyQuitAppLabel: string;
    hotkeyWatchBufLabel: string;
    hotkeyHandoffLabel: string;
    hotkeySyncLabel: string;
    hotkeyRecordPlaceholder: string;
    hotkeyRecordingBadge: string;
    hotkeyHoldPeekRecordingBadge: string;
    hotkeyResetDefaultBtn: string;
    sec4Title: string;
    adminNewUsernameLabel: string;
    adminCurrentPasswordLabel: string;
    adminNewPasswordLabel: string;
    adminConfirmPasswordLabel: string;
    adminUpdateBtn: string;
    adminPasswordMismatch: string;
    adminPasswordEmpty: string;
    adminUpdateSuccess: string;
    cancelBtn: string;
    saveApplyBtn: string;

    // Floating Widget
    widgetTooltip: string;

    // System Welcome Message & Default Handoff
    welcomeSysMessage: string;
    defaultHandoffGoal: string;
    defaultHandoffProgress: string;
    defaultHandoffNextSteps: string;
  }
> = {
  vi: {
    appTitle: 'NDEV::RING0_TRACE_DAEMON',
    nodeLabel: 'MÁY',
    switchEngineTooltip: 'Engine & Model đang hoạt động (Bấm để mở Settings đổi Engine/Model)',
    switchThemeTooltip: 'Đổi giao diện ngụy trang (Nhật ký Kernel vs Mã nguồn IDE)',
    themeKernelBtn: 'LOG_KERNEL',
    themeIdeBtn: 'CODE_IDE',
    watchBufBtn: 'SOI_TEXT',
    watchBufTooltip:
      'Mở cửa sổ phụ Memory Watch để kiểm tra chữ thật đang gõ, ảnh/file đính kèm và tin nhắn giải mã',
    handoffBtn: 'BÀN_GIAO',
    handoffTooltip: 'Xem/Sửa Bản tóm tắt bàn giao (Handoff Summary) đa máy',
    syncBtn: 'ĐỒNG_BỘ',
    syncingStatus: 'ĐANG_ĐỒNG_BỘ...',
    syncOkStatus: 'ĐÃ_ĐỒNG_BỘ',
    syncUnconfiguredBadge: 'CHƯA_CẤU_HÌNH_GDRIVE',
    syncErrorBadge: 'LỖI_ĐỒNG_BỘ',
    syncTooltip: 'Đồng bộ Lịch sử gốc & Handoff Summary lên Đám mây (Google Drive / Git)',
    settingsTooltip: 'Cấu hình Hệ thống, Engine/Model & Đồng bộ (Yêu cầu đăng nhập Super Admin)',
    cornerBtn: 'THU_GỌN',
    cornerTooltip: 'Thu nhỏ thành Icon Dev ở góc màn hình (Ctrl+Shift+X)',
    langTooltip: 'Chuyển đổi ngôn ngữ Tiếng Việt / Tiếng Anh (VI / EN)',

    reposTitle: 'DỰ ÁN (REPOS)',
    mountBtn: '+THÊM',
    mountTooltip: 'Thêm thư mục Git Repository trên máy này',
    msgsCount: 'tin',
    sessionsTreeLabel: 'CÁC PHIÊN CHAT (SESSIONS)',
    newChatSessionBtn: '+ Phiên chat mới',
    newChatSessionTooltip: 'Tạo một phiên (session) chat mới bên trong Repo này',
    renameSessionTooltip: 'Đổi tên phiên chat',
    deleteSessionTooltip: 'Xóa phiên chat này',
    sessionDefaultPrefix: 'Phiên',
    handoffSummaryTitle: 'TÓM TẮT BÀN GIAO',
    editHandoffTooltip: 'Xem / Chỉnh sửa Bản tóm tắt bàn giao',
    newSesBtn: 'PHIÊN MỚI',
    newSesTooltip: 'Tạo phiên (session) mới sạch sẽ trên máy này và nạp sẵn Handoff Summary',
    goalLabel: 'Mục tiêu:',
    nextStepsShortLabel: 'Tiếp theo:',
    localSesActive: 'Phiên máy này:',
    freshHandoffMode: 'Chế độ Handoff Mới',
    turnsSuffix: 'lượt chat',
    readyForHandoff: 'Sẵn sàng bàn giao ngữ cảnh đa máy.',
    newHandoffPreparedStatus:
      'ĐÃ_CHUẨN_BỊ_HANDOFF :: Lệnh tiếp theo sẽ tạo session sạch kèm Bản tóm tắt bàn giao',

    cipherMaskOn: 'MÃ_HÓA_GÕ: BẬT',
    cipherMaskOff: 'MÃ_HÓA_GÕ: TẮT',
    maskRust: 'Ngụy trang: Rust Kernel MMU',
    maskCpp: 'Ngụy trang: C++ Vulkan Compute',
    maskAsm: 'Ngụy trang: x86_64 ASM & Hex',
    modelPrefix: 'MODEL:',
    modelSelectTooltip: 'Chọn Model trong Settings',
    effortPrefix: 'MỨC ĐỘ:',
    effortLow: 'THẤP (LOW)',
    effortMedium: 'VỪA (MEDIUM)',
    effortHigh: 'CAO (HIGH)',
    effortXhigh: 'RẤT CAO (XHIGH)',
    effortMax: 'TỐI ĐA (MAX)',
    effortSelectTooltip: 'Chọn mức độ suy nghĩ / nỗ lực (Effort Level) cho lần gửi này',
    autoPermitOn: 'TỰ_DUYỆT: BẬT',
    autoPermitOff: 'TỰ_DUYỆT: HỎI',
    autoPermitTooltip:
      'Bật --dangerously-skip-permissions để chế độ chạy ngầm (headless) của AGY / Claude Code không bị chặn khi chạy lệnh hoặc sửa file',
    attachBtn: '+ẢNH/FILE',
    attachBtnTooltip:
      'Đính kèm ảnh hoặc file (Hoặc nhấn Ctrl+V để dán trực tiếp ảnh chụp màn hình / file vào khung chat)',
    pasteOrDropHint: 'Ctrl+V dán ảnh/file',
    removeAttachmentTooltip: 'Gỡ bỏ ảnh/file đính kèm này',
    attachmentsCountLabel: 'Đính kèm:',
    defaultAttachmentPrompt: 'Hãy phân tích hình ảnh / file đính kèm này.',
    altHeldNotice: '[ĐANG GIỮ ALT: HIỂN THỊ CHỮ & ẢNH THẬT]',
    inputHint:
      'Giữ [ALT] xem chữ/ảnh thật | [Ctrl+V] Dán ảnh/file | [Enter] Gửi | [Shift+Enter] Xuống dòng',
    bufLenLabel: 'ĐỘ_DÀI',
    disguisedPlaceholder:
      '// Gõ câu lệnh hoặc nhấn Ctrl+V để dán ảnh/file (hiển thị tự động ngụy trang thành code hệ thống)...',
    statusLabel: 'TRẠNG_THÁI:',
    defaultStatusIdle: 'RING0_SẴN_SÀNG :: Sẵn sàng bàn giao đa máy',
    syncedToPrefix: 'Đã đồng bộ ->',
    syncUnconfiguredDetail:
      'Chưa cấu hình Google Drive! Vui lòng đăng nhập Super Admin -> Settings (mục 2) để kết nối Google Drive.',
    syncErrorDetail: 'Lỗi đồng bộ Google Drive.',
    execSyscallBtn: 'THỰC_THI',
    sigintBtn: 'DỪNG',
    toggleDisguiseMsgTooltip:
      'Mặc định tin nhắn & ảnh/file được GIẤU thành code giả. Nhấn icon con mắt (hoặc giữ phím ALT) để xem nội dung thật',
    msgRealBadge: 'CHỮ THẬT',
    msgMaskedBadge: 'ĐÃ ẨN',
    decodedRealMsgHeader: '/** [NỘI_DUNG_TIN_NHẮN_THẬT]',
    effortBadgePrefix: 'mức:',
    streamChannelLabel: 'LUỒNG_XỬ_LÝ',
    agentStatusLabels: {
      idle: 'SẴN_SÀNG',
      thinking: 'ĐANG_SUY_NGHĨ',
      reading: 'ĐANG_ĐỌC_FILE',
      editing: 'ĐANG_SỬA_CODE',
      executing: 'ĐANG_CHẠY_LỆNH',
      syncing: 'ĐANG_ĐỒNG_BỘ',
      error: 'LỖI',
    },

    peekWindowTitle: 'DBG::SOI_BỘ_NHỚ_ĐỆM [0x7FF8_RAW_BUF] (CỬA SỔ SOI CHỮ THẬT)',
    closeInspectorTooltip: 'Đóng cửa sổ kiểm tra',
    colSymbol: 'BIẾN_NHỚ',
    colType: 'KIỂU',
    colValue: 'GIÁ TRỊ THẬT ĐANG GÕ (DECODED RAW STREAM)',
    symRawInputBuf: 'bộ_đệm_đang_gõ',
    typeUtf8Str: 'chuỗi [utf8]',
    symCipherLen: 'độ_dài_gõ',
    typeUsize: 'số_ký_tự',
    symAttachments: 'tệp_đính_kèm',
    typeDmaList: 'Vec<Tệp>',
    nullTerminatedEmpty: '"" // Chuỗi rỗng (Chưa gõ nội dung)',
    charsUnit: 'ký tự',
    peekInspectorAllMsgsLabel: 'LỊCH SỬ TIN NHẮN THẬT GẦN ĐÂY (ĐÃ GIẢI MÃ)',
    peekInspectorLastReplyLabel: 'PHẢN HỒI MỚI NHẤT TỪ AI',
    roleUser: 'NGƯỜI DÙNG',
    roleAssistant: 'TRỢ LÝ AI',
    roleSystem: 'HỆ THỐNG',
    verificationSynced: 'KÊNH_KIỂM_TRA: ĐÃ_ĐỒNG_BỘ',
    holdAltFooterHint: 'Khi focus cửa sổ này: Ấn/Giữ [ALT] sẽ MÃ HÓA text (ngược với UI chính)',
    peekInputPlaceholder: 'Nhập hoặc chỉnh sửa câu lệnh tại đây (Enter: Xuống dòng | Ctrl+Enter: Gửi)...',
    peekEnterNewlineModeOn: 'Enter ↵: Xuống dòng',
    peekEnterNewlineModeOff: 'Enter ↵: Gửi ngay',
    peekInsertNewlineBtn: '↵ Xuống dòng',
    peekSendBtn: '▶ Gửi (Ctrl+Enter)',
    peekAltMaskHint: 'Ấn [ALT] để mã hóa',
    peekAltMaskedActive: '[ĐANG ẤN ALT: ĐÃ MÃ HÓA TEXT]',
    peekOpacityLabel: 'ĐỘ_MỜ',
    peekConfirmSendTitle: 'XÁC NHẬN GỬI TIN NHẮN TỚI AI ENGINE',
    peekConfirmSendDesc: 'Bạn có chắc chắn muốn gửi nội dung tin nhắn này đi không?',
    peekConfirmSendBtn: '▶ Gửi ngay (Enter)',
    peekConfirmCancelBtn: 'Hủy / Sửa tiếp (ESC)',
    mainConfirmSendTitle: 'XÁC NHẬN GỬI TIN NHẮN TỚI AI ENGINE',
    mainConfirmSendDesc: 'Bạn có chắc chắn muốn gửi nội dung tin nhắn này tới AI Engine không?',
    mainConfirmSendBtn: '▶ Gửi ngay (Enter)',
    mainConfirmCancelBtn: 'Hủy / Sửa tiếp (ESC)',

    handoffModalTitle: 'BẢN TÓM TẮT BÀN GIAO ĐA MÁY (HANDOFF SUMMARY)',
    escCloseLabel: 'ĐÓNG [ESC]',
    handoffHowItWorksTitle: 'Cơ chế hoạt động:',
    handoffHowItWorksDesc: (turns: number) =>
      `NdevTool không ép --resume file .jsonl chéo máy (tránh lỗi xung đột đường dẫn Windows ↔ Linux). Khi mở trên máy mới, NdevTool tạo session mới sạch 100% và nạp sẵn Bản tóm tắt bàn giao dưới đây kèm ${turns} lượt chat gần nhất.`,
    currentMachineSessionLabel: 'Trạng thái Session tại máy này',
    sessionActiveSuffix: 'Đang hoạt động',
    freshSessionPending: 'Phiên Mới (Sẽ tự động nạp Handoff ở câu lệnh tiếp theo)',
    fieldCurrentGoal: '1. Mục tiêu hiện tại (Current Goal)',
    fieldCurrentGoalPlaceholder: 'Nhập mục tiêu hiện tại của dự án...',
    fieldRecentProgress: '2. Tiến độ & Quyết định quan trọng vừa thực hiện (Recent Progress)',
    fieldRecentProgressPlaceholder:
      'Tóm tắt những việc vừa hoàn thành hoặc quyết định kỹ thuật quan trọng...',
    fieldTouchedFiles: '3. Các file vừa đọc/sửa (Touched Files - cách nhau dấu phẩy)',
    fieldTouchedFilesPlaceholder:
      'Ví dụ: electron/main.ts, src/App.tsx (cách nhau bằng dấu phẩy)',
    fieldNextSteps: '4. Các bước tiếp theo cần làm khi mở máy mới (Next Steps / Notes)',
    fieldNextStepsPlaceholder:
      'Ghi chú các việc cần làm tiếp theo khi mở trên máy khác...',
    resetAndLoadHandoffBtn: 'Tạo Session Mới + Nạp Handoff Ngay',
    resetAndLoadHandoffTooltip:
      'Xóa session ID cũ trên máy này để lượt chat tiếp theo tạo session mới kèm Handoff Summary',
    closeBtn: 'Đóng',
    saveHandoffBtn: 'Lưu Bản Bàn Giao',

    standardAiBadgeOk: 'AI Standard OK',
    standardAiBadgeWarning: 'Chưa chuẩn hóa AI',
    scaffoldStandardBtn: '⚡ Khởi tạo cấu trúc AI chuẩn',
    scaffoldingStandardInProgress: 'Đang khởi tạo cấu trúc chuẩn...',
    scaffoldStandardSuccess: 'Đã khởi tạo thành công cấu trúc AI Workspace Standard!',
    diskHandoffLinked: 'Đã liên kết tệp đĩa',
    openLatestHandoffBtn: 'Mở handoff/latest.md',
    reloadFromDiskBtn: 'Tải lại từ đĩa',
    openDecisionsBtn: 'decisions/',
    openTasksBtn: 'tasks/',
    openDocsBtn: 'docs/',
    missingStandardComponents: (missing: string[]) => `Thiếu: ${missing.join(', ')}`,

    adminLoginModalTitle: 'XÁC THỰC SUPER ADMIN :: MỞ KHÓA CHỨC NĂNG BẢO MẬT',
    adminLoginSubtitle:
      'Chỉ có duy nhất 1 tài khoản Super Admin của bạn. Khi bấm chuột vào Settings, WATCH_BUF, HANDOFF hoặc SYNC (mà không dùng phím tắt riêng) đều phải đăng nhập.',
    adminUsernameLabel: 'Tài khoản Super Admin duy nhất',
    adminPasswordLabel: 'Mật khẩu Super Admin',
    adminPasswordPlaceholder: 'Nhập mật khẩu Super Admin...',
    adminDefaultHint:
      'Mặc định lần đầu: Tài khoản "admin" / Mật khẩu "admin" (Bạn có thể đổi sang mật khẩu riêng tại mục 4 trong Settings).',
    adminLoginBtn: 'Đăng nhập & Mở khóa',
    adminVerifyingBtn: 'Đang xác thực...',
    adminInvalidCredentials: 'Sai tài khoản hoặc mật khẩu Super Admin! Vui lòng kiểm tra lại.',

    settingsModalTitle: 'NDEVTOOL :: CẤU HÌNH HỆ THỐNG, ENGINE/MODEL & ĐỒNG BỘ (SUPER ADMIN)',
    sec1Title: '1. NGÔN NGỮ, CHỌN ENGINE / MODEL & CHIẾN LƯỢC BÀN GIAO',
    uiLanguageLabel: 'Ngôn ngữ Giao diện (UI Language)',
    langOptionVi: 'Tiếng Việt (Vietnamese)',
    langOptionEn: 'Tiếng Anh (English)',
    continuityStrategyLabel: 'Chiến lược liên tục Context đa máy (Continuity Strategy)',
    strategySmartHandoff:
      'Smart Handoff (Cùng máy: Resume nhanh | Đổi máy: Tạo Session mới + Nạp Handoff)',
    strategyAlwaysHandoff:
      'Always Fresh Handoff (Luôn tạo Session mới sạch + Nạp Handoff Summary)',
    recentTurnsCountLabel: 'Số lượt chat gần nhất nạp kèm Handoff Summary',
    claudeCliPathLabel: 'Đường dẫn Claude Code CLI (Windows / Linux)',
    defaultActiveEngineLabel: 'Chọn Code Engine đang sử dụng (Active Engine)',
    activeModelForEngineLabel: 'Chọn Model đang sử dụng (Active Model của Engine trên)',
    modelCustomOption: 'Tùy chỉnh model ID... (Other model)',
    customModelPlaceholder: 'Nhập mã model ID (vd: claude-sonnet-5-5, claude-opus-5-5)...',
    winMinimize: 'Thu nhỏ cửa sổ (Minimize)',
    winMaximize: 'Phóng to / Toàn màn hình (Maximize)',
    winRestore: 'Khôi phục kích thước cửa sổ (Restore)',
    winClose: 'Đóng ứng dụng (Close)',
    claudeModelLabel: 'Model Claude Code CLI',
    deepseekModelLabel: 'Model DeepSeek',
    codexModelLabel: 'Model OpenAI Codex',
    engineDescClaude: 'Claude Code CLI (Luồng Stream-JSON)',
    engineDescAgy: 'Google Antigravity (AGY / AgentAPI)',
    engineDescDeepseek: 'DeepSeek Coder API',
    engineDescCodex: 'OpenAI Codex / o3-mini',
    antigravityCliPathLabel: 'Đường dẫn Antigravity CLI / AgentAPI (agy / agentapi.bat)',
    antigravityModelLabel: 'Model Antigravity (AGY)',
    deepseekApiKeyLabel: 'DeepSeek API Key (Tùy chọn)',
    codexApiKeyLabel: 'OpenAI Codex API Key (Tùy chọn)',
    engineScannerTitle: 'QUÉT TỰ ĐỘNG & XÁC THỰC ĐĂNG NHẬP CÁC AI ENGINE (AUTO-SCAN & AUTH)',
    engineScanBtn: 'Quét lại các Engine (Auto-Scan)',
    engineScanningBtn: 'Đang quét hệ thống...',
    engineStatusFound: 'Đã tìm thấy CLI',
    engineStatusMissing: 'Chưa tìm thấy CLI',
    engineAuthOk: 'Đã xác thực (Auth OK)',
    engineAuthMissing: 'Chưa đăng nhập (Chưa Auth)',
    engineLoginBtn: 'Đăng nhập / Auth Login',
    engineManualBrowseBtn: 'Trỏ file bằng tay...',
    engineManualBrowseHint: 'Hệ thống tự động quét đường dẫn các Engine; chỉ cần bấm "Trỏ file bằng tay..." nếu đặt ở thư mục riêng không quét được.',
    engineWarningBanner: 'Cảnh báo: Có Engine chưa tìm thấy file thực thi hoặc chưa đăng nhập xác thực (Auth Login). Hãy bấm "Đăng nhập / Auth Login" hoặc "Trỏ file bằng tay..." bên dưới.',
    engineLoginModalTitle: 'XÁC THỰC & ĐĂNG NHẬP AI ENGINE (ENGINE AUTH LOGIN)',
    engineLoginModalSubtitle: 'Bạn có thể mở cửa sổ đăng nhập OAuth/CLI chính thức hoặc nhập trực tiếp API Key / Token xác thực cho Engine này.',
    engineLoginCliSectionTitle: 'Cách 1: Đăng nhập OAuth qua CLI chính thức trên máy',
    engineLoginCliBtn: 'Mở Cửa Sổ Đăng Nhập CLI Ngay ↗',
    engineLoginRecheckBtn: 'Đã đăng nhập xong -> Kiểm tra lại trạng thái',
    engineLoginKeySectionTitle: 'Cách 2: Nhập trực tiếp API Key / Token xác thực vào NdevTool',
    engineLoginSaveKeyBtn: 'Lưu Key & Xác thực ngay',
    sec2Title: '2. KÊNH ĐỒNG BỘ ĐÁM MÂY (GOOGLE DRIVE / PRIVATE GIT)',
    transportChannelLabel:
      'Kênh vận chuyển file Lịch sử gốc & Handoff Summary siêu nhẹ (.ndev.json)',
    transportBoth: 'Kết hợp (Thư mục Google Drive/Rclone + Google Drive REST API v3)',
    transportFolder: 'Chỉ dùng Thư mục Google Drive Desktop / Rclone trên máy',
    transportGitRepo: 'Private Git Memory Repo (Tự động git pull/push file .ndev.json)',
    transportGdriveApi: 'Chỉ dùng Google Drive REST API v3 trực tiếp',
    syncFolderLabel:
      'Đường dẫn Thư mục Google Drive Desktop / Rclone hoặc Private Git Repo (Nếu cài trên máy)',
    syncFolderPlaceholder:
      'G:\\My Drive\\NdevTool_Sync (Để trống nếu dùng Google Drive API ở trên)',
    browseBtn: 'Chọn thư mục...',
    gdriveFolderNameLabel: 'Tên thư mục thật trên Google Drive (Tự động tạo nếu chưa có)',
    gdriveFolderIdLabel: 'Hoặc dán Link / ID thư mục Google Drive có sẵn (Tùy chọn)',
    gdriveAuthMethodLabel: 'Phương thức xác thực Google Drive API v3',
    gdriveAuthOptionToken:
      '1. OAuth2 Access Token nhanh (Google OAuth Playground - Tạo thư mục thật ngay trong 10s)',
    gdriveAuthOptionBrowser:
      '2. Đăng nhập Google qua Trình duyệt (OAuth2 Client ID + Refresh Token tự động làm mới)',
    gdriveAuthOptionSa:
      '3. Google Service Account JSON Key (Cố định vĩnh viễn, không cần trình duyệt)',
    gdriveTokenLabel: 'Google Drive OAuth2 Access Token',
    gdriveTokenPlaceholder:
      'ya29.a0... (Bấm nút bên trên -> Authorize APIs -> Exchange authorization code -> Copy Access token)',
    gdriveGetPlaygroundTokenBtn: 'Lấy Token nhanh từ Google OAuth Playground ↗',
    gdriveClientIdLabel: 'Google OAuth2 Client ID (Desktop App)',
    gdriveClientSecretLabel: 'Google OAuth2 Client Secret',
    gdriveConnectedEmailStatus: (email: string) => `Đã liên kết: ${email}`,
    gdriveAutoRefreshHint: 'Tự động lưu Refresh Token để đồng bộ lâu dài',
    gdriveSignInBrowserBtn: 'Đăng nhập Google qua Trình duyệt & Tạo thư mục ↗',
    gdriveServiceAccountLabel: 'Nội dung hoặc Đường dẫn file Service Account JSON (Vĩnh viễn)',
    gdrivePickSaFileBtn: 'Chọn file .json...',
    gdriveSaNote:
      '* Lưu ý: Khi dùng Service Account, hãy tạo 1 thư mục trên Google Drive của bạn, Share (Chia sẻ) thư mục đó cho client_email của Service Account với quyền Editor, và dán Link thư mục vào ô phía trên.',
    gdriveTestAndCreateFolderBtn:
      'Kiểm tra kết nối & Tạo/Đồng bộ vào Thư mục thật trên Google Drive ngay',
    gdriveTestingBtn: 'Đang tạo thư mục & đồng bộ lên Google Drive...',
    gdriveOpenWebFolderBtn: 'Mở thư mục trên Google Drive ↗',
    gdriveSaLoadedMsg: (email: string) =>
      `Đã nạp Service Account: ${email}. Hãy Share thư mục Google Drive cho email này rồi bấm Kiểm tra & Đồng bộ.`,
    gdriveTestingProgressMsg:
      'Đang kết nối Google Drive API & tạo/đồng bộ thư mục thật...',
    gdriveTestSuccessMsg: (count, folderName, email, folderId) =>
      `Thành công! Đã lưu ${count} repo vào thư mục thật "${folderName}" trên Google Drive (${
        email || 'Đã kết nối'
      }). Folder ID: ${folderId}`,
    gdriveTestFailMsg: 'Kết nối Google Drive thất bại.',
    gdriveOAuthBrowserWaitMsg:
      'Đang mở trình duyệt để đăng nhập Google... Vui lòng hoàn tất xác thực trên trình duyệt.',
    gdriveOAuthSuccessMsg: (email, count, folderName) =>
      `Đã đăng nhập Google (${email}) & đồng bộ ${count} repo vào thư mục thật "${folderName}"!`,
    gdriveOAuthFailMsg: 'Đăng nhập OAuth2 thất bại.',
    aesPassphraseLabel: 'Mật khẩu mã hóa AES-256 khi đồng bộ Cloud',
    aesPlaceholder: 'Để trống nếu muốn lưu JSON thuần',
    sec3Title: '3. CHẾ ĐỘ TÀNG HÌNH, PHÍM TẮT (HOTKEYS) & KHỞI ĐỘNG CÙNG HỆ ĐIỀU HÀNH',
    autoStartCheckbox: 'Tự động mở ở chế độ Icon góc màn hình khi bật máy (Windows & Linux)',
    alwaysOnTopCheckbox: 'Luôn ghim cửa sổ nổi trên cùng (Always-on-Top)',
    autoSyncCheckbox: 'Tự động đồng bộ lên Cloud sau mỗi lượt AI trả lời',
    hotkeysSectionTitle: 'CẤU HÌNH TỔ HỢP PHÍM TẮT NHANH TOÀN CỤC (GLOBAL HOTKEYS)',
    hotkeysSectionDesc:
      'Nhấn vào ô phím tắt bất kỳ rồi bấm phím đơn (Alt, Ctrl, Shift, F1-F12, CapsLock...) hoặc tổ hợp phím mới để thay đổi tùy ý. Riêng WATCH_BUF, HANDOFF và SYNC khi bấm bằng phím tắt sẽ thực thi ngay lập tức (bỏ qua bước đăng nhập Super Admin).',
    hotkeyHoldPeekLabel: '0. Phím nhấn giữ để Giải mã (UI chính) / Mã hóa ngược (WATCH_BUF)',
    hotkeyToggleAppLabel: '1. Ẩn / Hiện nhanh toàn bộ phần mềm (Stealth Hide/Show)',
    hotkeyToggleWidgetLabel: '2. Thu nhỏ Icon góc / Phóng to cửa sổ (Corner Widget)',
    hotkeyQuitAppLabel: '3. Tắt hẳn phần mềm khẩn cấp (Panic Exit / Quit App)',
    hotkeyWatchBufLabel: '4. Mở / Đóng nhanh WATCH_BUF (Hiện ngay không cần Login)',
    hotkeyHandoffLabel: '5. Mở / Đóng nhanh HANDOFF (Hiện ngay không cần Login)',
    hotkeySyncLabel: '6. Đồng bộ Cloud SYNC ngay lập tức (Chạy ngay không cần Login)',
    hotkeyRecordPlaceholder: 'Nhấn vào đây rồi bấm phím hoặc tổ hợp phím...',
    hotkeyRecordingBadge: 'ĐANG GHI PHÍM... (Bấm phím đơn / tổ hợp phím hoặc ESC để hủy)',
    hotkeyHoldPeekRecordingBadge: 'ĐANG GHI... (Bấm Alt, Ctrl, Shift, F1-F12 hoặc phím bất kỳ | ESC hủy)',
    hotkeyResetDefaultBtn: 'Khôi phục phím mặc định',
    sec4Title: '4. ĐỔI THÔNG TIN TÀI KHOẢN SUPER ADMIN DUY NHẤT',
    adminNewUsernameLabel: 'Tên tài khoản Super Admin',
    adminCurrentPasswordLabel: 'Mật khẩu hiện tại',
    adminNewPasswordLabel: 'Mật khẩu mới',
    adminConfirmPasswordLabel: 'Xác nhận mật khẩu mới',
    adminUpdateBtn: 'Đổi Mật Khẩu Super Admin',
    adminPasswordMismatch: 'Mật khẩu mới xác nhận không khớp!',
    adminPasswordEmpty: 'Vui lòng nhập mật khẩu hiện tại và mật khẩu mới.',
    adminUpdateSuccess: 'Đã cập nhật tài khoản & mật khẩu Super Admin thành công!',
    cancelBtn: 'Hủy',
    saveApplyBtn: 'Lưu & Áp dụng',

    widgetTooltip: 'NdevTool Daemon (Nhấn để mở rộng | Ctrl+Shift+X)',
    welcomeSysMessage:
      'Chào mừng đến với NdevTool! Hệ thống đang ở chế độ Ngụy trang (Stealth Mode) & Bàn giao đa máy (Cross-Machine Handoff). Khi bạn gõ hoặc dán ảnh/file (Ctrl+V) vào ô bên dưới, hiển thị sẽ biến thành code Kernel/Rust thật. Giữ phím [ALT] hoặc mở cửa sổ [SOI_TEXT] để xem nội dung thật.',
    defaultHandoffGoal: 'Thiết lập môi trường AI Coding Ngụy trang & Đồng bộ Handoff đa máy',
    defaultHandoffProgress:
      'Đã kích hoạt Bộ gõ Ngụy trang (Cipher Input), Claude Code / Antigravity Adapter và cơ chế Handoff Summary.',
    defaultHandoffNextSteps:
      'Tiếp tục từ yêu cầu mới nhất của người dùng và kiểm tra các thay đổi trên máy hiện tại.',
  },
  en: {
    appTitle: 'NDEV::RING0_TRACE_DAEMON',
    nodeLabel: 'NODE',
    switchEngineTooltip: 'Active Engine & Model (Click to open Settings to change Engine/Model)',
    switchThemeTooltip: 'Switch Disguise View Style (Kernel Log vs IDE Code Comment)',
    themeKernelBtn: 'KERN_LOG',
    themeIdeBtn: 'IDE_SRC',
    watchBufBtn: 'WATCH_BUF',
    watchBufTooltip:
      'Open Secondary Memory Watch Window to verify real typed text, attachments and decoded messages',
    handoffBtn: 'HANDOFF',
    handoffTooltip: 'View/Edit Cross-Machine Handoff Summary & Continuity Mode',
    syncBtn: 'SYNC',
    syncingStatus: 'SYNCING...',
    syncOkStatus: 'SYNC_OK',
    syncUnconfiguredBadge: 'GDRIVE_UNCONFIGURED',
    syncErrorBadge: 'SYNC_ERR',
    syncTooltip: 'Sync Master History & Handoff Summary to Cloud (Google Drive / Git)',
    settingsTooltip: 'Configure System, Engine/Model & Cloud Sync (Requires Super Admin Login)',
    cornerBtn: 'CORNER',
    cornerTooltip: 'Collapse to Corner Dev Icon (Ctrl+Shift+X)',
    langTooltip: 'Switch UI Language Vietnamese / English (VI / EN)',

    reposTitle: 'REPOS',
    mountBtn: '+MOUNT',
    mountTooltip: 'Mount Local Git Repository',
    msgsCount: 'msgs',
    sessionsTreeLabel: 'CHAT SESSIONS',
    newChatSessionBtn: '+ New Session',
    newChatSessionTooltip: 'Create a new chat session under this Repository',
    renameSessionTooltip: 'Rename chat session',
    deleteSessionTooltip: 'Delete this chat session',
    sessionDefaultPrefix: 'Session',
    handoffSummaryTitle: 'HANDOFF SUMMARY',
    editHandoffTooltip: 'Inspect / Edit Handoff Summary',
    newSesBtn: 'NEW SES',
    newSesTooltip:
      'Force fresh session on this machine pre-loaded with Handoff Summary + recent turns',
    goalLabel: 'Goal:',
    nextStepsShortLabel: 'Next:',
    localSesActive: 'Local Ses:',
    freshHandoffMode: 'Fresh Handoff Mode',
    turnsSuffix: 'turns',
    readyForHandoff: 'Ready for cross-machine context handoff.',
    newHandoffPreparedStatus:
      'NEW_HANDOFF_PREPARED :: Next prompt starts a clean session with Handoff Summary',

    cipherMaskOn: 'CIPHER_MASK: ON',
    cipherMaskOff: 'CIPHER_MASK: OFF',
    maskRust: 'Mask: Rust Kernel MMU',
    maskCpp: 'Mask: C++ Vulkan Compute',
    maskAsm: 'Mask: x86_64 ASM & Hex Dump',
    modelPrefix: 'MODEL:',
    modelSelectTooltip: 'Select Model inside Settings',
    effortPrefix: 'EFFORT:',
    effortLow: 'LOW',
    effortMedium: 'MEDIUM',
    effortHigh: 'HIGH',
    effortXhigh: 'XHIGH',
    effortMax: 'MAX',
    effortSelectTooltip: 'Select reasoning Effort Level for this message',
    autoPermitOn: 'AUTO_PERMIT: ON',
    autoPermitOff: 'AUTO_PERMIT: ASK',
    autoPermitTooltip:
      'Pass --dangerously-skip-permissions so headless AGY / Claude Code tools are not auto-denied',
    attachBtn: '+IMG/FILE',
    attachBtnTooltip:
      'Attach images or files (Or press Ctrl+V to paste screenshots/files directly into chat)',
    pasteOrDropHint: 'Ctrl+V paste img/file',
    removeAttachmentTooltip: 'Remove this attachment',
    attachmentsCountLabel: 'Attached:',
    defaultAttachmentPrompt: 'Please analyze the attached image(s) / file(s).',
    altHeldNotice: '[ALT HELD: SHOWING REAL PROMPT & IMAGES]',
    inputHint:
      'Hold [ALT] to peek | [Ctrl+V] Paste image/file | [Enter] Execute | [Shift+Enter] Newline',
    bufLenLabel: 'BUF_LEN',
    disguisedPlaceholder:
      '// Type any prompt or press Ctrl+V to paste image/file (displayed characters are disguised as systems code)...',
    statusLabel: 'STATUS:',
    defaultStatusIdle: 'RING0_IDLE :: Handoff Ready',
    syncedToPrefix: 'Synced ->',
    syncUnconfiguredDetail:
      'Google Drive is not configured! Please authenticate as Super Admin -> Settings (Section 2) to connect Google Drive.',
    syncErrorDetail: 'Google Drive sync error.',
    execSyscallBtn: 'EXEC_SYSCALL',
    sigintBtn: 'SIGINT',
    toggleDisguiseMsgTooltip:
      'Messages & attachments are disguised as systems code by default. Click the eye icon (or hold ALT) to reveal real content',
    msgRealBadge: 'REAL',
    msgMaskedBadge: 'MASKED',
    decodedRealMsgHeader: '/** [DECODED_REAL_MESSAGE]',
    effortBadgePrefix: 'effort:',
    streamChannelLabel: 'STREAM_DMA_CHANNEL',
    agentStatusLabels: {
      idle: 'IDLE',
      thinking: 'THINKING',
      reading: 'READING',
      editing: 'EDITING',
      executing: 'EXECUTING',
      syncing: 'SYNCING',
      error: 'ERROR',
    },

    peekWindowTitle: 'DBG::WATCH_MEMORY_INSPECTOR [0x7FF8_RAW_BUF] (REAL TEXT INSPECTOR)',
    closeInspectorTooltip: 'Close Inspector Window',
    colSymbol: 'SYMBOL',
    colType: 'TYPE',
    colValue: 'VALUE (DECODED RAW STREAM)',
    symRawInputBuf: 'raw_input_buf',
    typeUtf8Str: '&str [utf8]',
    symCipherLen: 'cipher_len',
    typeUsize: 'usize',
    symAttachments: 'dma_attachments',
    typeDmaList: 'Vec<FileBuf>',
    nullTerminatedEmpty: '"" // Null-terminated (No input typed yet)',
    charsUnit: 'chars',
    peekInspectorAllMsgsLabel: 'RECENT DECODED MESSAGES',
    peekInspectorLastReplyLabel: 'LATEST AI RESPONSE',
    roleUser: 'USER',
    roleAssistant: 'ASSISTANT',
    roleSystem: 'SYSTEM',
    verificationSynced: 'VERIFICATION_CHANNEL: SYNCED',
    holdAltFooterHint: 'When focused here: Hold [ALT] to ENCRYPT/MASK text (reverse of main UI)',
    peekInputPlaceholder: 'Type or edit prompt here (Enter: Newline | Ctrl+Enter: Send)...',
    peekEnterNewlineModeOn: 'Enter ↵: Newline',
    peekEnterNewlineModeOff: 'Enter ↵: Send',
    peekInsertNewlineBtn: '↵ Newline',
    peekSendBtn: '▶ Send (Ctrl+Enter)',
    peekAltMaskHint: 'Hold [ALT] to mask',
    peekAltMaskedActive: '[ALT HELD: TEXT ENCRYPTED]',
    peekOpacityLabel: 'OPACITY',
    peekConfirmSendTitle: 'CONFIRM SENDING MESSAGE TO AI ENGINE',
    peekConfirmSendDesc: 'Are you sure you want to send this message right now?',
    peekConfirmSendBtn: '▶ Send Now (Enter)',
    peekConfirmCancelBtn: 'Cancel / Keep Editing (ESC)',
    mainConfirmSendTitle: 'CONFIRM SENDING MESSAGE TO AI ENGINE',
    mainConfirmSendDesc: 'Are you sure you want to dispatch this message to the AI Engine?',
    mainConfirmSendBtn: '▶ Send Now (Enter)',
    mainConfirmCancelBtn: 'Cancel / Keep Editing (ESC)',

    handoffModalTitle: 'CROSS-MACHINE HANDOFF SUMMARY',
    escCloseLabel: 'CLOSE [ESC]',
    handoffHowItWorksTitle: 'How it works:',
    handoffHowItWorksDesc: (turns: number) =>
      `NdevTool never forces cross-machine .jsonl --resume (avoiding Windows ↔ Linux path/cwd breakage). When opening on a new machine, NdevTool starts a 100% clean session pre-loaded with this Handoff Summary + the last ${turns} conversation turns.`,
    currentMachineSessionLabel: 'Session status on this machine',
    sessionActiveSuffix: 'Active',
    freshSessionPending: 'Fresh Session (Will inject Handoff on next prompt)',
    fieldCurrentGoal: '1. Current Goal',
    fieldCurrentGoalPlaceholder: 'Enter current project goal...',
    fieldRecentProgress: '2. Recent Progress & Key Decisions',
    fieldRecentProgressPlaceholder:
      'Summarize recent progress and key technical decisions...',
    fieldTouchedFiles: '3. Touched Files (comma-separated)',
    fieldTouchedFilesPlaceholder:
      'e.g. electron/main.ts, src/App.tsx (comma-separated)',
    fieldNextSteps: '4. Next Steps / Notes for next machine',
    fieldNextStepsPlaceholder:
      'Notes or next steps when continuing on another machine...',
    resetAndLoadHandoffBtn: 'Start Fresh Session + Inject Handoff Now',
    resetAndLoadHandoffTooltip:
      'Clear old session ID on this machine so the next prompt starts a clean session with Handoff Summary',
    closeBtn: 'Close',
    saveHandoffBtn: 'Save Handoff',

    standardAiBadgeOk: 'AI Standard OK',
    standardAiBadgeWarning: 'AI Standard Missing',
    scaffoldStandardBtn: '⚡ Scaffold AI Standard',
    scaffoldingStandardInProgress: 'Scaffolding standard structure...',
    scaffoldStandardSuccess: 'Successfully scaffolded AI Workspace Standard structure!',
    diskHandoffLinked: 'Disk File Linked',
    openLatestHandoffBtn: 'Open handoff/latest.md',
    reloadFromDiskBtn: 'Reload from disk',
    openDecisionsBtn: 'decisions/',
    openTasksBtn: 'tasks/',
    openDocsBtn: 'docs/',
    missingStandardComponents: (missing: string[]) => `Missing: ${missing.join(', ')}`,

    adminLoginModalTitle: 'SUPER ADMIN AUTHENTICATION :: UNLOCK PROTECTED ACTION',
    adminLoginSubtitle:
      'Restricted to your single Super Admin account. Clicking Settings, WATCH_BUF, HANDOFF or SYNC without using your secret hotkey requires authentication.',
    adminUsernameLabel: 'Single Super Admin Username',
    adminPasswordLabel: 'Super Admin Password',
    adminPasswordPlaceholder: 'Enter Super Admin password...',
    adminDefaultHint:
      'First-time default: Username "admin" / Password "admin" (You can change your password in Settings Section 4).',
    adminLoginBtn: 'Sign In & Unlock',
    adminVerifyingBtn: 'Verifying...',
    adminInvalidCredentials: 'Invalid Super Admin username or password! Please try again.',

    settingsModalTitle: 'NDEVTOOL :: SYSTEM, ENGINE/MODEL & CLOUD SYNC (SUPER ADMIN)',
    sec1Title: '1. LANGUAGE, ENGINE / MODEL SELECTION & CONTINUITY STRATEGY',
    uiLanguageLabel: 'Interface Language (Ngôn ngữ giao diện)',
    langOptionVi: 'Vietnamese (Tiếng Việt)',
    langOptionEn: 'English (Tiếng Anh)',
    continuityStrategyLabel: 'Cross-Machine Continuity Strategy',
    strategySmartHandoff:
      'Smart Handoff (Same Machine: Resume | Switched Machine: Fresh Session + Handoff)',
    strategyAlwaysHandoff:
      'Always Fresh Handoff (Always start clean session + Handoff Summary)',
    recentTurnsCountLabel: 'Recent conversation turns injected with Handoff Summary',
    claudeCliPathLabel: 'Claude Code CLI Path (Windows / Linux)',
    defaultActiveEngineLabel: 'Active Code Engine',
    activeModelForEngineLabel: 'Active Model (for Selected Engine)',
    modelCustomOption: 'Other model (enter id)...',
    customModelPlaceholder: 'Enter model ID (e.g. claude-sonnet-5-5, claude-opus-5-5)...',
    winMinimize: 'Minimize',
    winMaximize: 'Maximize / Fullscreen',
    winRestore: 'Restore',
    winClose: 'Close Application',
    claudeModelLabel: 'Claude Code CLI Model',
    deepseekModelLabel: 'DeepSeek Model',
    codexModelLabel: 'OpenAI Codex Model',
    engineDescClaude: 'Claude Code CLI (Stream-JSON)',
    engineDescAgy: 'Google Antigravity (AGY / AgentAPI)',
    engineDescDeepseek: 'DeepSeek Coder API',
    engineDescCodex: 'OpenAI Codex / o3-mini',
    antigravityCliPathLabel: 'Antigravity CLI / AgentAPI Path (agy / agentapi.bat)',
    antigravityModelLabel: 'Antigravity (AGY) Model',
    deepseekApiKeyLabel: 'DeepSeek API Key (Optional)',
    codexApiKeyLabel: 'OpenAI Codex API Key (Optional)',
    engineScannerTitle: 'AUTO-SCAN & AUTHENTICATION STATUS FOR AI ENGINES',
    engineScanBtn: 'Re-Scan Engines (Auto-Scan)',
    engineScanningBtn: 'Scanning system...',
    engineStatusFound: 'CLI Found',
    engineStatusMissing: 'CLI Not Found',
    engineAuthOk: 'Authenticated (Auth OK)',
    engineAuthMissing: 'Not Logged In (Unauthenticated)',
    engineLoginBtn: 'Sign In / Auth Login',
    engineManualBrowseBtn: 'Browse Manually...',
    engineManualBrowseHint: 'Engines are auto-scanned automatically; only use "Browse Manually..." if an engine is in a custom non-standard directory.',
    engineWarningBanner: 'Warning: One or more engines could not be found or are not logged in. Click "Sign In / Auth Login" or "Browse Manually..." below.',
    engineLoginModalTitle: 'AI ENGINE AUTHENTICATION & LOGIN',
    engineLoginModalSubtitle: 'Launch the official interactive CLI OAuth login window or enter an API Key / Token directly for this engine.',
    engineLoginCliSectionTitle: 'Option 1: Interactive Official CLI OAuth Sign-In',
    engineLoginCliBtn: 'Launch CLI Auth Login Window ↗',
    engineLoginRecheckBtn: 'Completed Sign-In -> Re-check Auth Status',
    engineLoginKeySectionTitle: 'Option 2: Enter API Key / Auth Token Directly in NdevTool',
    engineLoginSaveKeyBtn: 'Save Key & Authenticate Now',
    sec2Title: '2. CLOUD TRANSPORT (GOOGLE DRIVE / PRIVATE GIT)',
    transportChannelLabel:
      'Transport Channel (Syncs lightweight Master History & Handoff .ndev.json)',
    transportBoth: 'Both (Google Drive / Rclone Folder + Direct REST API v3)',
    transportFolder: 'Google Drive Desktop / Rclone Folder Only',
    transportGitRepo: 'Private Git Memory Repo (Auto git pull/push .ndev.json)',
    transportGdriveApi: 'Direct Google Drive REST API v3 Only',
    syncFolderLabel:
      'Local Google Drive Desktop / Rclone or Private Git Repo Directory (If mounted)',
    syncFolderPlaceholder:
      'G:\\My Drive\\NdevTool_Sync (Leave blank if using Google Drive API above)',
    browseBtn: 'Browse...',
    gdriveFolderNameLabel: 'Real Folder Name on Google Drive (Auto-created if missing)',
    gdriveFolderIdLabel: 'Or Paste Existing Google Drive Folder Link / ID (Optional)',
    gdriveAuthMethodLabel: 'Google Drive API v3 Authentication Method',
    gdriveAuthOptionToken:
      '1. Quick OAuth2 Access Token (Google OAuth Playground - Create real folder in 10s)',
    gdriveAuthOptionBrowser:
      '2. Browser Google Sign-In (OAuth2 Client ID + Auto-refreshing Refresh Token)',
    gdriveAuthOptionSa:
      '3. Google Service Account JSON Key (Permanent, no browser required)',
    gdriveTokenLabel: 'Google Drive OAuth2 Access Token',
    gdriveTokenPlaceholder:
      'ya29.a0... (Click button above -> Authorize APIs -> Exchange authorization code -> Copy Access token)',
    gdriveGetPlaygroundTokenBtn: 'Get Quick Token from Google OAuth Playground ↗',
    gdriveClientIdLabel: 'Google OAuth2 Client ID (Desktop App)',
    gdriveClientSecretLabel: 'Google OAuth2 Client Secret',
    gdriveConnectedEmailStatus: (email: string) => `Connected: ${email}`,
    gdriveAutoRefreshHint: 'Automatically saves Refresh Token for long-term sync',
    gdriveSignInBrowserBtn: 'Sign in with Google via Browser & Create Folder ↗',
    gdriveServiceAccountLabel: 'Service Account JSON Content or File Path (Permanent)',
    gdrivePickSaFileBtn: 'Select .json file...',
    gdriveSaNote:
      '* Note: When using a Service Account, create a folder on your Google Drive, Share it with the Service Account client_email as Editor, and paste the Folder Link above.',
    gdriveTestAndCreateFolderBtn:
      'Test Connection & Create/Sync to Real Google Drive Folder Now',
    gdriveTestingBtn: 'Creating folder & syncing to Google Drive...',
    gdriveOpenWebFolderBtn: 'Open Folder on Google Drive ↗',
    gdriveSaLoadedMsg: (email: string) =>
      `Loaded Service Account: ${email}. Share your Google Drive folder with this email, then click Test & Sync.`,
    gdriveTestingProgressMsg:
      'Connecting to Google Drive API & creating/syncing real folder...',
    gdriveTestSuccessMsg: (count, folderName, email, folderId) =>
      `Success! Synced ${count} repo(s) to real folder "${folderName}" on Google Drive (${
        email || 'Connected'
      }). Folder ID: ${folderId}`,
    gdriveTestFailMsg: 'Google Drive connection failed.',
    gdriveOAuthBrowserWaitMsg:
      'Opening browser for Google Sign-In... Please complete authentication in your browser.',
    gdriveOAuthSuccessMsg: (email, count, folderName) =>
      `Signed in to Google (${email}) & synced ${count} repo(s) to real folder "${folderName}"!`,
    gdriveOAuthFailMsg: 'OAuth2 Sign-In failed.',
    aesPassphraseLabel: 'AES-256 Cloud Sync Encryption Passphrase',
    aesPlaceholder: 'Leave blank for plain JSON',
    sec3Title: '3. STEALTH, GLOBAL HOTKEYS & OS STARTUP (WINDOWS & LINUX)',
    autoStartCheckbox: 'Launch in Corner Icon mode on OS startup',
    alwaysOnTopCheckbox: 'Keep window Always-on-Top',
    autoSyncCheckbox: 'Auto-sync to Cloud after each response',
    hotkeysSectionTitle: 'GLOBAL QUICK HOTKEYS CONFIGURATION',
    hotkeysSectionDesc:
      'Click any hotkey field and press any single key (Alt, Ctrl, Shift, F1-F12, CapsLock...) or key combination to customize freely. Pressing the WATCH_BUF, HANDOFF or SYNC hotkey executes them immediately without requiring Super Admin login.',
    hotkeyHoldPeekLabel: '0. Hold Key to Peek Real Text (Main UI) / Mask Text (WATCH_BUF)',
    hotkeyToggleAppLabel: '1. Quick Hide / Show Entire App (Stealth Boss Key)',
    hotkeyToggleWidgetLabel: '2. Toggle Corner Widget / Full Window Mode',
    hotkeyQuitAppLabel: '3. Panic Exit / Quit Application Immediately',
    hotkeyWatchBufLabel: '4. Quick Toggle WATCH_BUF (Instant, Bypass Login)',
    hotkeyHandoffLabel: '5. Quick Toggle HANDOFF (Instant, Bypass Login)',
    hotkeySyncLabel: '6. Quick Trigger Cloud SYNC (Instant, Bypass Login)',
    hotkeyRecordPlaceholder: 'Click here and press key or combo...',
    hotkeyRecordingBadge: 'RECORDING KEYS... (Press key / combo or ESC to cancel)',
    hotkeyHoldPeekRecordingBadge: 'RECORDING... (Press Alt, Ctrl, Shift, F1-F12 or any key | ESC cancel)',
    hotkeyResetDefaultBtn: 'Reset Default Hotkeys',
    sec4Title: '4. UPDATE SINGLE SUPER ADMIN CREDENTIALS',
    adminNewUsernameLabel: 'Super Admin Username',
    adminCurrentPasswordLabel: 'Current Password',
    adminNewPasswordLabel: 'New Password',
    adminConfirmPasswordLabel: 'Confirm New Password',
    adminUpdateBtn: 'Update Super Admin Password',
    adminPasswordMismatch: 'New password confirmation does not match!',
    adminPasswordEmpty: 'Please enter both current password and new password.',
    adminUpdateSuccess: 'Super Admin username & password updated successfully!',
    cancelBtn: 'Cancel',
    saveApplyBtn: 'Save & Apply',

    widgetTooltip: 'NdevTool Daemon (Click to expand | Ctrl+Shift+X)',
    welcomeSysMessage:
      'Welcome to NdevTool! Stealth Mode & Cross-Machine Handoff Continuity are active. Type or paste images/files (Ctrl+V) in the console below: displayed characters transform into authentic Kernel/Rust systems code. Hold [ALT] or open [WATCH_BUF] to inspect your real prompt.',
    defaultHandoffGoal: 'Setup Stealth Hacker AI Coding Environment & Cross-Machine Handoff',
    defaultHandoffProgress:
      'Configured Camouflage Cipher Input, Claude Code / Antigravity Adapter, and Handoff Summary Engine.',
    defaultHandoffNextSteps:
      'Continue from the latest user instruction and verify changes on the current machine.',
  },
};

export function localizeHandoffField(
  rawValue: string | undefined,
  field: 'goal' | 'progress' | 'nextSteps',
  lang: AppLanguage
): string {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.vi;
  const val = (rawValue || '').trim();

  if (field === 'goal') {
    if (
      !val ||
      val.startsWith('Setup Stealth') ||
      val.startsWith('Initialized NdevTool') ||
      val === 'Initial repository setup' ||
      val.startsWith('Thiết lập môi trường AI Coding')
    ) {
      return t.defaultHandoffGoal;
    }
    const initMatch = val.match(/^(?:Initialize context for|Khởi tạo ngữ cảnh cho)\s+(.+)$/i);
    if (initMatch) {
      return lang === 'vi'
        ? `Khởi tạo ngữ cảnh cho dự án ${initMatch[1]}`
        : `Initialize context for ${initMatch[1]}`;
    }
    return val;
  }

  if (field === 'progress') {
    if (
      !val ||
      val.startsWith('Configured Camouflage') ||
      val.startsWith('Đã kích hoạt Bộ gõ Ngụy trang') ||
      val === 'Context initialized.' ||
      val === 'Đã khởi tạo ngữ cảnh.'
    ) {
      return t.defaultHandoffProgress;
    }
    if (val === 'Repository mounted in NdevTool.' || val === 'Đã gắn dự án vào NdevTool.') {
      return lang === 'vi' ? 'Đã gắn dự án vào NdevTool.' : 'Repository mounted in NdevTool.';
    }
    return val;
  }

  if (field === 'nextSteps') {
    if (
      !val ||
      val.startsWith('Continue from the latest user instruction') ||
      val.startsWith('Tiếp tục từ yêu cầu mới nhất') ||
      val.startsWith('Type any prompt below') ||
      val.startsWith('Gõ câu lệnh bất kỳ') ||
      val === 'Start coding session.' ||
      val === 'Bắt đầu phiên lập trình.'
    ) {
      return t.defaultHandoffNextSteps;
    }
    return val;
  }

  return val;
}

export function localizeMessageText(
  msg: { id?: string; role?: string; realContent: string },
  lang: AppLanguage
): string {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.vi;
  if (
    msg.id === 'welcome-sys-1' ||
    (msg.role === 'system' &&
      (msg.realContent.startsWith('Chào mừng đến với NdevTool') ||
        msg.realContent.startsWith('Welcome to NdevTool')))
  ) {
    return t.welcomeSysMessage;
  }
  return msg.realContent;
}

export function localizeStatusDetail(detail: string, lang: AppLanguage): string {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.vi;
  if (
    !detail ||
    detail === 'RING0_IDLE :: Handoff Ready' ||
    detail === 'System Idle (Handoff Ready)' ||
    detail.startsWith('RING0_SẴN_SÀNG')
  ) {
    return t.defaultStatusIdle;
  }
  if (
    detail.startsWith('NEW_HANDOFF_PREPARED') ||
    detail.startsWith('ĐÃ_CHUẨN_BỊ_HANDOFF')
  ) {
    return t.newHandoffPreparedStatus;
  }
  if (
    detail.startsWith('Chưa cấu hình Google Drive') ||
    detail.startsWith('Google Drive is not configured') ||
    detail === 'Chưa kết nối Google Drive.'
  ) {
    return t.syncUnconfiguredDetail;
  }
  if (detail.startsWith('Synced -> ') || detail.startsWith('Đã đồng bộ -> ')) {
    const target = detail.replace(/^(?:Synced -> |Đã đồng bộ -> )/, '');
    return `${t.syncedToPrefix} ${target}`;
  }
  return detail;
}
