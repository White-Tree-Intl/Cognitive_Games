from flask import Flask, render_template, redirect, url_for, request

app = Flask(__name__)

# --- Game Data and Translations ---

GAMES = [
    {'acronym': 'IOR', 'url': '/ior_game'},
    {'acronym': 'DST', 'url': '/digit_span_game'},
    {'acronym': 'EHC-FUPD', 'url': '/eye_hand_fupd_game'},
    {'acronym': 'EHC-MUD', 'url': '/eye_hand_mud_game'},
    {'acronym': 'PVT', 'url': '/psychomotor_vigilance_game'},
    {'acronym': 'VWM', 'url': '/visual_working_memory_game'},
    {'acronym': 'MT', 'url': '/maze_game'},
    {'acronym': 'SAT', 'url': '/selective_attention_game'},
    {'acronym': 'VMT', 'url': '/visual_memory_test_game'}
]

translations = {
    'en': {
        'select_game_title': 'Select a Game',
        'IOR': 'Inhibition of Return Test',
        'DST': 'Digit Span Test',
        'MT': 'Maze Test',
        'VWM': 'Visual Working Memory Span Test',
        'SAT': 'Selective Attention Test',
        'EHC-FUPD': 'Eye-Hand Coordination Test (Fixed Path)',
        'VMT': 'Visual Memory Test',
        'EHC-MUD': 'Eye-Hand Coordination Test (Random Path)',
        'PVT': 'Psychomotor Vigilance Test',
        # --- General Strings ---
        'back_to_selection': 'Back to Game Selection',
        'start_game_button': 'Start Game',
        'start_practice_button': 'Start Practice',
        'practice_again_button': 'Practice Again',
        'start_main_game_button': 'Start Main Game',
        'practice_round_title': 'Practice Round',
        'main_game_title': 'Main Game',
        'practice_over_title': 'Practice Over',
        'task_finished_title': 'Task Finished',
        'results_saved_message': 'Results saved locally.',
        'rotate_device_message': 'Please rotate your device to landscape mode for the best experience.',
        'computers_turn': "Watch the sequence...",
        'your_turn': "Your turn!",
        'correct_message': 'Correct!',
        'incorrect_message': 'Incorrect. Try again.',
        'get_ready_for_main_test': 'Get ready for the main test.',
        'times_up_message': "Time's up!",
        # --- IOR Game Strings ---
        'ior_instructions_title': 'Instructions',
        'ior_instructions_line1': 'Press the button corresponding to the side where the GREEN light appears.',
        'left_button': 'Left',
        'right_button': 'Right',
        # --- DST Game Strings ---
        'dst_instructions_title': 'Instructions',
        'dst_instructions_line1': 'A sequence of numbers will appear one by one.',
        'dst_instructions_line2': 'Your task is to repeat the sequence in the exact same order.',
        'dst_instructions_line3': 'The test will start with a short practice round.',
        'submit_button': 'Submit',
        'clear_button': 'Clear',
        'game_over_fail_message': 'Task finished. You failed the same level twice.',
        # --- EHC Games Strings ---
        'ehc_instructions_title': 'Instructions',
        'ehc_fupd_instructions_line1': 'A ball will appear on a square track. To start, move your cursor over the ball until it turns white.',
        'ehc_mud_instructions_line1': 'A ball will appear on the screen. To start, move your cursor over the ball until it turns white.',
        'ehc_instructions_line2': 'Your task is to keep your cursor on the ball as it moves.',
        'ehc_instructions_line3': "The ball's color indicates your accuracy. The test includes a short practice round.",
        'learning_phase_title': 'Learning Phase',
        'testing_phase_title': 'Testing Phase',
        'practice_complete_message': 'Practice Complete!',
        # --- PVT Game Strings ---
        'pvt_instructions_title': 'Instructions',
        'pvt_instructions_line1': 'Tap the BLUE circle as quickly as possible when it appears.',
        'pvt_instructions_line2': 'IGNORE the other shape if it appears. Only tap the circle.',
        'pvt_instructions_line3': 'The test includes a short practice round.',
        # --- VWM Game Strings ---
        'vwm_instructions_title': 'Instructions',
        'vwm_instructions_line1': 'Circles will light up in a sequence. Memorize the order.',
        'vwm_instructions_line2': 'Your task is to click the circles in the exact same order.',
        'vwm_instructions_line3': 'The main test has two phases. Phase 2 includes a delay before you can respond.',
        'phase_1_title': 'Phase 1: No Delay',
        'phase_2_title': 'Phase 2: With Delay',
        'memorize_message': 'Memorize!',
        # --- Maze Game Strings ---
        'maze_instructions_title': 'Instructions',
        'maze_instructions_line1': 'Navigate from the start (orange circle) to the goal (star).',
        'maze_instructions_line2': 'Click on the hollow white circles to move one step at a time.',
        'maze_instructions_line3': 'Complete each maze within the time and step limits.',
        'steps_label': 'Steps',
        'min_steps_label': 'Min',
        'time_left_label': 'Time',
        # --- VMT Game Strings ---
        'VMT': 'Visual Memory Test',
        'vmt_instructions_title': 'Instructions',
        'vmt_instructions_line1': 'Memorize the trio of objects displayed on the first screen.',
        'vmt_instructions_line2': 'On the second screen, select the identical trio from the four options.',
        'vmt_instructions_line3': 'The exposure time and distance between objects will vary.',
        'model_turn': 'Memorize the Model',
        'user_turn': 'Select the Matching Trio',
        'confirm_button': 'Confirm Selection',
        'target_label': 'TARGET',
        'current_trial_label': 'Trial',
        'too_slow_message': 'Too slow! Time is up.',
    },
    'fa': {
        'select_game_title': 'یک بازی را انتخاب کنید',
        'IOR': 'تست مهار بازگشت',
        'DST': 'تست حافظه عددی',
        'MT': 'تست ماز',
        'VWM': 'تست حافظه کاری دیداری',
        'SAT': 'تست توجه انتخابی',
        'EHC-FUPD': 'تست هماهنگی چشم و دست (مسیر ثابت)',
        'VMT': 'تست حافظه دیداری',
        'EHC-MUD': 'تست هماهنگی چشم و دست (مسیر تصادفی)',
        'PVT': 'تست هوشیاری روانی-حرکتی',
        # --- General Strings ---
        'back_to_selection': 'بازگشت به انتخاب بازی',
        'start_game_button': 'شروع بازی',
        'start_practice_button': 'شروع تمرین',
        'practice_again_button': 'تمرین مجدد',
        'start_main_game_button': 'شروع بازی اصلی',
        'practice_round_title': 'مرحله تمرینی',
        'main_game_title': 'بازی اصلی',
        'practice_over_title': 'پایان تمرین',
        'task_finished_title': 'آزمون تمام شد',
        'results_saved_message': 'نتایج در مرورگر شما ذخیره شد.',
        'rotate_device_message': 'لطفاً برای بهترین تجربه، دستگاه خود را در حالت افقی قرار دهید.',
        'computers_turn': "به دنباله دقت کنید...",
        'your_turn': "نوبت شما!",
        'correct_message': 'صحیح!',
        'incorrect_message': 'اشتباه بود. دوباره تلاش کنید.',
        'get_ready_for_main_test': 'برای آزمون اصلی آماده شوید.',
        'times_up_message': 'زمان تمام شد!',
        # --- IOR Game Strings ---
        'ior_instructions_title': 'دستورالعمل',
        'ior_instructions_line1': 'دکمه مربوط به سمتی که چراغ سبز روشن می‌شود را فشار دهید.',
        'ior_instructions_line2': 'ابتدا یک نقطه زرد به عنوان نشانه ظاهر می‌شود. به نقطه زرد واکنش نشان ندهید.',
        'ior_instructions_line3': 'فقط دکمه مربوط به سمتی که چراغ سبز روشن می‌شود را فشار دهید.',
        'left_button': 'چپ',
        'right_button': 'راست',
        # --- DST Game Strings ---
        'dst_instructions_title': 'دستورالعمل',
        'dst_instructions_line1': 'دنباله‌ای از اعداد یک به یک نمایش داده می‌شود.',
        'dst_instructions_line2': 'وظیفه شما تکرار دنباله با همان ترتیب دقیق است.',
        'dst_instructions_line3': 'آزمون با یک مرحله تمرینی کوتاه شروع می‌شود.',
        'submit_button': 'ثبت',
        'clear_button': 'پاک کردن',
        'game_over_fail_message': 'آزمون تمام شد. شما دو بار در یک مرحله اشتباه کردید.',
        # --- EHC Games Strings ---
        'ehc_instructions_title': 'دستورالعمل',
        'ehc_fupd_instructions_line1': 'یک توپ روی یک مسیر مربعی ظاهر می‌شود. برای شروع، نشانگر خود را روی توپ ببرید تا سفید شود.',
        'ehc_mud_instructions_line1': 'یک توپ روی صفحه ظاهر می‌شود. برای شروع، نشانگر خود را روی توپ ببرید تا سفید شود.',
        'ehc_instructions_line2': 'وظیفه شما این است که نشانگر خود را روی توپی که حرکت می‌کند، نگه دارید.',
        'ehc_instructions_line3': 'رنگ توپ دقت شما را نشان می‌دهد. آزمون شامل یک مرحله تمرینی کوتاه است.',
        'practice_complete_message': 'تمرین تمام شد!',
        # --- PVT Game Strings ---
        'pvt_instructions_title': 'دستورالعمل',
        'pvt_instructions_line1': 'به محض ظاهر شدن دایره آبی، سریع روی آن ضربه بزنید.',
        'pvt_instructions_line2': 'اگر شکل دیگری ظاهر شد، آن را نادیده بگیرید. فقط روی دایره ضربه بزنید.',
        'pvt_instructions_line3': 'آزمون شامل یک مرحله تمرینی کوتاه است.',
        # --- VWM Game Strings ---
        'vwm_instructions_title': 'دستورالعمل',
        'vwm_instructions_line1': 'دایره‌ها به ترتیب روشن می‌شوند. ترتیب را به خاطر بسپارید.',
        'vwm_instructions_line2': 'وظیفه شما این است که دایره‌ها را با همان ترتیب دقیق کلیک کنید.',
        'vwm_instructions_line3': 'بازی اصلی دو مرحله دارد. مرحله دوم قبل از پاسخ شما یک تأخیر خواهد داشت.',
        'phase_1_title': 'مرحله ۱: بدون تأخیر',
        'phase_2_title': 'مرحله ۲: با تأخیر',
        'memorize_message': 'به خاطر بسپارید!',
        # --- Maze Game Strings ---
        'maze_instructions_title': 'دستورالالعمل',
        'maze_instructions_line1': 'از نقطه شروع (دایره نارنجی) به سمت هدف (ستاره) حرکت کنید.',
        'maze_instructions_line2': 'برای حرکت، روی دایره‌های توخالی سفید کلیک کنید.',
        'maze_instructions_line3': 'هر ماز را در محدوده زمانی و تعداد حرکات مشخص شده کامل کنید.',
        'steps_label': 'حرکت',
        'min_steps_label': 'حداقل',
        'time_left_label': 'زمان',
        # --- VMT Game Strings ---
        'VMT': 'تست حافظه دیداری',
        'vmt_instructions_title': 'دستورالعمل',
        'vmt_instructions_line1': 'توالی سه‌تایی اشیایی که در صفحه اول نمایش داده می‌شود را به خاطر بسپارید.',
        'vmt_instructions_line2': 'در صفحه دوم، از میان چهار گزینه، توالی سه‌تایی مشابه را انتخاب کنید.',
        'vmt_instructions_line3': 'زمان نمایش و فاصله بین اشیاء در مراحل مختلف تغییر خواهد کرد.',
        'model_turn': 'مدل را به خاطر بسپارید',
        'user_turn': 'توالی سه‌تایی مطابق را انتخاب کنید',
        'confirm_button': 'تأیید انتخاب',
        'target_label': 'هدف',
        'current_trial_label': 'نوبت',
        'too_slow_message': 'خیلی آهسته! زمان به پایان رسید.',
    }
}

@app.route('/')
def home():
    return redirect(url_for('select_game', lang='en'))

@app.route('/select_game')
def select_game():
    lang = request.args.get('lang', 'en')
    if lang not in translations:
        lang = 'en'
    strings = translations[lang]
    return render_template('game_selection.html', games=GAMES, lang=lang, strings=strings)

# --- Game Page Routes ---
@app.route('/ior_game')
def ior_game_page():
    lang = request.args.get('lang', 'en')
    if lang not in translations:
        lang = 'en'
    strings = translations[lang]
    return render_template('ior_game.html', lang=lang, strings=strings)

@app.route('/digit_span_game')
def digit_span_game_page():
    lang = request.args.get('lang', 'en')
    if lang not in translations:
        lang = 'en'
    strings = translations[lang]
    return render_template('digit_span_game.html', lang=lang, strings=strings)

@app.route('/eye_hand_fupd_game')
def eye_hand_fupd_game_page():
    lang = request.args.get('lang', 'en')
    if lang not in translations:
        lang = 'en'
    strings = translations[lang]
    return render_template('eye_hand_fupd_game.html', lang=lang, strings=strings)

@app.route('/eye_hand_mud_game')
def eye_hand_mud_game_page():
    lang = request.args.get('lang', 'en')
    if lang not in translations:
        lang = 'en'
    strings = translations[lang]
    return render_template('eye_hand_mud_game.html', lang=lang, strings=strings)

@app.route('/psychomotor_vigilance_game')
def psychomotor_vigilance_game_page():
    lang = request.args.get('lang', 'en')
    if lang not in translations:
        lang = 'en'
    strings = translations[lang]
    return render_template('psychomotor_vigilance_game.html', lang=lang, strings=strings)

@app.route('/visual_working_memory_game')
def visual_working_memory_game_page():
    lang = request.args.get('lang', 'en')
    if lang not in translations:
        lang = 'en'
    strings = translations[lang]
    return render_template('visual_working_memory_game.html', lang=lang, strings=strings)

@app.route('/maze_game')
def maze_game_page():
    lang = request.args.get('lang', 'en')
    if lang not in translations:
        lang = 'en'
    strings = translations[lang]
    return render_template('maze_game.html', lang=lang, strings=strings)

@app.route('/visual_memory_test_game')
def visual_memory_test_game_page():
    lang = request.args.get('lang', 'en')
    if lang not in translations:
        lang = 'en'
    strings = translations[lang]
    return render_template('visual_memory_test_game.html', lang=lang, strings=strings)

@app.route('/selective_attention_game')
def selective_attention_game_page():
    lang = request.args.get('lang', 'en')
    if lang not in translations:
        lang = 'en'
    strings = translations[lang]
    return render_template('selective_attention_game.html', lang=lang, strings=strings)

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)
