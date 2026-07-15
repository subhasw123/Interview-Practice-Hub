from functools import wraps

from flask import flash, redirect, url_for
from flask_login import current_user


def is_admin(user):
    return getattr(user, "role", None) == "admin"


def admin_required(view_func):
    @wraps(view_func)
    def wrapped(*args, **kwargs):
        if not current_user.is_authenticated:
            flash("Please log in first.", "warning")
            return redirect(url_for("login"))

        if not is_admin(current_user):
            flash("You do not have permission to access this page.", "danger")
            return redirect(url_for("home"))

        return view_func(*args, **kwargs)

    wrapped.__name__ = view_func.__name__
    wrapped.__doc__ = view_func.__doc__
    return wrapped
