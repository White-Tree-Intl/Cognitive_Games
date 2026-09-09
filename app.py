from flask import (
    Flask,
    render_template,
    redirect,
    url_for,
    request,
    jsonify,
    send_file
)
from flask_sqlalchemy import SQLAlchemy
from flask_login import (
    LoginManager,
    UserMixin,
    login_user,
    login_required,
    logout_user,
    current_user
)
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import pandas as pd
import os
import zipfile
from io import BytesIO


# =====================================================
# App Configuration
# =====================================================

app = Flask(__name__)

app.config['SECRET_KEY'] = 'your_secret_key_here'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = "signin"

# =====================================================
# Database Models
# =====================================================

class User(UserMixin, db.Model):
    __tablename__ = "users"

    user_id = db.Column(db.Integer, primary_key=True)

    user_name = db.Column(db.String(100), nullable=False)
    user_lastname = db.Column(db.String(100), nullable=False)
    user_email = db.Column(db.String(120), unique=True, index=True, nullable=False)
    user_password = db.Column(db.String(255), nullable=False)

    gender = db.Column(db.String(1))
    birthdate = db.Column(db.String(10))
    age = db.Column(db.Integer)

    country = db.Column(db.String(50), default="IRAN")
    device = db.Column(db.String(50), default="IPHONE")

    assessments = db.relationship(
        "Assessment",
        backref="user",
        lazy=True,
        cascade="all, delete-orphan"
    )

    def get_id(self):
        return str(self.user_id)



class Assessment(db.Model):
    __tablename__ = "assessments"

    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.user_id")
    )

    group = db.Column(db.String(50))
    assessment_type = db.Column(db.String(50))
    assessment_acronym = db.Column(db.String(20))
    training_type = db.Column(db.String(50))
    assessment_date = db.Column(db.DateTime)

    task_name = db.Column(db.String(100))
    variable = db.Column(db.String(100))
    value = db.Column(db.Float)

    device = db.Column(db.String(50))
    gender = db.Column(db.String(20))
    birthdate = db.Column(db.String(20))
    country = db.Column(db.String(50))
    age = db.Column(db.Integer)


@login_manager.user_loader
def load_user(user_id):
    return db.session.get(User, int(user_id))


# =====================================================
# Game Data & Translations (UNCHANGED)
# =====================================================

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
        # --- SAT Game Strings ---
        'sat_instructions_title': 'Instructions',
        'sat_instructions_line1': 'A target shape will be shown first.',
        'sat_instructions_line2': 'Then choose the matching items as quickly and accurately as possible.',
        'sat_instructions_line3': 'The test includes a short practice round.',
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
        # --- SAT Game Strings ---
        'sat_instructions_title': 'دستورالعمل',
        'sat_instructions_line1': 'ابتدا شکل هدف به شما نشان داده می‌شود.',
        'sat_instructions_line2': 'سپس باید آیتم‌های مطابق را با دقت و سرعت انتخاب کنید.',
        'sat_instructions_line3': 'آزمون شامل یک مرحله تمرینی کوتاه است.',
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

# =====================================================
# Helper Functions
# =====================================================

def get_language():
    lang = request.args.get('lang', 'en')
    if lang not in translations:
        lang = 'en'
    return lang, translations[lang]


def render_game(template_name):
    lang, strings = get_language()
    return render_template(template_name, lang=lang, strings=strings)

# =====================================================
def calculate_age(birthdate_str):
    birthdate = datetime.strptime(birthdate_str, "%Y-%m-%d")
    today = datetime.today()
    return today.year - birthdate.year - (
        (today.month, today.day) < (birthdate.month, birthdate.day)
    )



# =====================================================
# Authentication Routes
# =====================================================

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        name = request.form.get('name', '').strip()
        lastname = request.form.get('lastname', '').strip()
        email = request.form.get('email', '').strip()
        password = request.form.get('password', '').strip()
        gender = request.form.get('gender')
        birthdate = request.form.get('birthdate')  # YYYY-MM-DD

        if not all([name, lastname, email, password, gender, birthdate]):
            return "All fields are required", 400

        if User.query.filter_by(user_email=email).first():
            return "Email already registered", 400

        age = calculate_age(birthdate)

        hashed_password = generate_password_hash(password)

        new_user = User(
            user_name=name,
            user_lastname=lastname,
            user_email=email,
            user_password=hashed_password,
            gender='M' if gender.lower() == 'male' else 'F',
            birthdate=birthdate,
            age=age,
            country="IRAN",
            device="IPHONE"
        )

        db.session.add(new_user)
        db.session.commit()

        return redirect(url_for('signin'))

    return render_template('signup.html')



@app.route('/signin', methods=['GET', 'POST'])
def signin():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        email = email.strip()
        password = password.strip()

        user = User.query.filter_by(user_email=email).first()


        if user and check_password_hash(user.user_password, password):
            login_user(user)
            return redirect(url_for('select_game'))


        return "Invalid credentials"

    return render_template('signin.html')


@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('signin'))


# =====================================================
# Main Pages
# =====================================================

@app.route('/')
@login_required
def home():
    return redirect(url_for('select_game', lang='en'))


@app.route('/select_game')
@login_required
def select_game():
    lang, strings = get_language()
    
    completed_records = Assessment.query.filter_by(user_id=current_user.user_id).all()
    completed_acronyms = list(set([r.assessment_acronym for r in completed_records]))

    return render_template(
        'game_selection.html',
        games=GAMES,
        lang=lang,
        strings=strings,
        completed_acronyms=completed_acronyms
    )


# =====================================================
# Game Routes (NO LOGIC CHANGED)
# =====================================================

@app.route('/ior_game')
@login_required
def ior_game_page():
    return render_game('ior_game.html')


@app.route('/digit_span_game')
@login_required
def digit_span_game_page():
    return render_game('digit_span_game.html')


@app.route('/eye_hand_fupd_game')
@login_required
def eye_hand_fupd_game_page():
    return render_game('eye_hand_fupd_game.html')


@app.route('/eye_hand_mud_game')
@login_required
def eye_hand_mud_game_page():
    return render_game('eye_hand_mud_game.html')


@app.route('/psychomotor_vigilance_game')
@login_required
def psychomotor_vigilance_game_page():
    return render_game('psychomotor_vigilance_game.html')


@app.route('/visual_working_memory_game')
@login_required
def visual_working_memory_game_page():
    return render_game('visual_working_memory_game.html')


@app.route('/maze_game')
@login_required
def maze_game_page():
    return render_game('maze_game.html')


@app.route('/visual_memory_test_game')
@login_required
def visual_memory_test_game_page():
    return render_game('visual_memory_test_game.html')


@app.route('/selective_attention_game')
@login_required
def selective_attention_game_page():
    return render_game('selective_attention_game.html')


# =====================================================
# Save Game Results API
# =====================================================

@app.route('/save_result', methods=['POST'])
@login_required
def save_result():
    data = request.get_json()

    if not data or not data.get("task_name"):
        return jsonify({"error": "Invalid data"}), 400


    result = Assessment(
        user_id=current_user.user_id,
        group=data.get("group"),
        assessment_type=data.get("assessment_type"),
        assessment_acronym=data.get("assessment_acronym"),
        training_type=data.get("training_type"),
        assessment_date=datetime.utcnow(),

        task_name=data.get("task_name"),
        variable=data.get("variable"),
        value=data.get("value"),

        device=current_user.device,
        gender=current_user.gender,
        birthdate=current_user.birthdate,
        country=current_user.country,
        age=current_user.age
    )



    db.session.add(result)
    db.session.commit()

    return jsonify({"message": "Result saved successfully"}), 201


# =====================================================
# Export Routes
# =====================================================

@app.route('/export/excel')
def export_excel():
    users = User.query.all()
    assessments = Assessment.query.all()

    users_data = [{
        "user_id": u.user_id,
        "user_name": u.user_name,
        "user_lastname": u.user_lastname,
        "user_email": u.user_email,
        "user_password": u.user_password if hasattr(u, 'user_password') else "",
        "gender": u.gender,
        "birthdate": u.birthdate,
        "age": u.age,
        "country": u.country,
        "device": u.device
    } for u in users]

    task_name_mapping = {
        'psychomotor_vigilance_test': 'Psychomotor Vigilance Test',
        'digit_span': 'Digit Span Test',
        'eye_hand_coordination_mud': 'Eye-Hand Coordination Test (MUD)',
        'eye_hand_coordination_fupd': 'Eye-Hand Coordination Test (FTUD)', 
        'maze_test': 'Maze Test',
        'visual_memory': 'Visual Memory Test',
        'VMT': 'Visual Memory Test',
        'VWM': 'Visual Working Memory Span Test',
        'inhibition_of_return': 'Inhibition of Return Test',
        'selective_attention': 'Selective Attention Test',
        'selective_attention_test': 'Selective Attention Test'
    }

    # دیکشنری نگاشت نام متغیرها
    variable_name_mapping = {
        'accuracy': 'Accuracy',
        'accuracy_cued': 'Accuracy in cued trials',
        'response_time': 'Response time',
        'accuracy_uncued': 'Accuracy in uncued trials',
        'inhibition_of_return_effect_in_response_time': 'Inhibition of return effect in response time',
        'omission_errors': 'Omission errors',
        'response_time_cued': 'Response time in cued trials',
        'memory_span': 'Memory span',
        'average_number_of_trials_in_correct_series': 'Average number of trials in correct series',
        'accuracy_in_slow_speed': 'Accuracy in slow speed',
        'accuracy_in_long_segments_duration': 'Accuracy in long segments duration',
        'accuracy_in_fast_speed': 'Accuracy in fast speed',
        'distance_from_the_ball_center': 'Distance from the ball center',
        'accuracy_in_short_segments_duration': 'Accuracy in short segments duration',
        'accuracy_in_low_demand': 'Accuracy in low demand',
        'response_time_in_high_demand': 'Response time in high demand',
        'accuracy_in_high_demand': 'Accuracy in high demand',
        'completion_time': 'Completion time',
        'omission_errors_in_low_demand': 'Omission errors in low demand',
        'omission_errors_percentage': 'Omission errors (percentage)',
        'commission_errors': 'Commission errors',
        'commission_errors_percentage': 'Commission errors (percentage)',
        'omission_errors_in_high_demand': 'Omission errors in high demand',
        'inaccurate_clicks': 'Inaccurate clicks',
        'response_time_in_low_demand': 'Response time in low demand',
        'avg_rt': 'Response time',
        'mazes_completed': 'Mazes completed',
        'completion_time_in_first_maze': 'Completion time in first maze'
    }

    assessments_data = [{
        "id": a.id,
        "user_id": a.user_id,
        "group": a.group,
        "assessment_type": a.assessment_type,
        "assessment_acronym": a.assessment_acronym,
        "training_type": a.training_type,
        "assessment_date": a.assessment_date,
        "task_name": task_name_mapping.get(a.task_name, a.task_name),
        # اعمال نگاشت برای متغیرها در این قسمت
        "variable": variable_name_mapping.get(a.variable, a.variable),
        "value": a.value,
        "device": a.device,
        "gender": a.gender,
        "birthdate": a.birthdate,
        "country": a.country,
        "age": a.age
    } for a in assessments]

    users_df = pd.DataFrame(users_data)
    assessments_df = pd.DataFrame(assessments_data)

    zip_buffer = BytesIO()

    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        users_excel = BytesIO()
        users_df.to_excel(users_excel, index=False)
        zip_file.writestr("users.xlsx", users_excel.getvalue())

        assessments_excel = BytesIO()
        assessments_df.to_excel(assessments_excel, index=False)
        zip_file.writestr("RawData.xlsx", assessments_excel.getvalue())

    zip_buffer.seek(0)

    return send_file(
        zip_buffer,
        as_attachment=True,
        download_name="database_export.zip",
        mimetype="application/zip"
    )


# =====================================================
# Initialize Database
# =====================================================

with app.app_context():
    db.create_all()

# =====================================================
# Run App
# =====================================================

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)
