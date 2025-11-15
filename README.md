# Cognitive Games Project

This project is a collection of web-based cognitive games implemented using the Flask framework in Python.

## 🚀 Setup and Run Guide

This guide is written for someone with no prior background. Follow the steps one by one.

### Step 1: Prerequisites (Install Python)

You only need **Python**.

1.  Go to the [official Python website](https://www.python.org/downloads/) and download the latest version.
2.  **Very Important:** During installation, on the first page of the installer, make sure to check the box labeled **"Add Python to PATH"**. If you don't do this, the commands in the terminal will not work.

### Step 2: Get the Project Code

1.  At the top of this GitHub page, click the green **`<> Code`** button.
2.  Select the **`Download ZIP`** option.
3.  Unzip (or Extract) the downloaded ZIP file to any location you prefer.

### Step 3: Prepare the Project Environment

Now, we need to install the libraries that this project depends on.

1.  **Open Terminal in the Project Folder:**

      * Go into the folder you extracted in the previous step (the `Cognitive_Games` folder).
      * In the address bar at the top of the window (where the file path is written), click, clear everything, type **`cmd`**, and press `Enter`.

2.  **Create a Virtual Environment (Venv):**

      * In the black window that just opened (CMD), type the following command to create an isolated environment for the project:

    <!-- end list -->

    ```bash
    python -m venv .venv
    ```

3.  **Activate the Virtual Environment:**

      * Now, run the following command to enter this environment:

    <!-- end list -->

    ```bash
    .\.venv\Scripts\activate
    ```

      * (After running this command, you should see `(.venv)` added to the beginning of your command prompt.)

4.  **Install Packages:**

      * Finally, install all the required libraries (listed in `requirements.txt`) with this command:

    <!-- end list -->

    ```bash
    pip install -r requirements.txt
    ```

### Step 4: Run the Application

1.  **Run the Flask Server:**

      * In the same terminal where your environment is active (`(.venv)`), run the following command:

    <!-- end list -->

    ```bash
    flask run
    ```

2.  **View in Browser:**

      * The terminal will show you a message similar to `Running on http://127.0.0.1:5000`.
      * Open your web browser (like Chrome or Firefox) and go to the following address:
      * [http://127.0.0.1:5000](http://127.0.0.1:5000)

Congratulations\! The cognitive games application is now running.