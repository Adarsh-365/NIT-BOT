from django.http import HttpResponse
from django.shortcuts import render
from .sharedict import session_state
from .index import  chat_input
from    django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json

@csrf_exempt  # Remove this if you want CSRF protection and are sending the token
def callbot_api(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8'))
            user_input = data.get('userMessage', '')
        except Exception:
            user_input = ''
        # print("user_input",user_input)
        if user_input:
            response = chat_input(user_input)
            # print(response)
            return JsonResponse({'botText': response})
    return JsonResponse({'botText': ''})


def index(request):
    request.session.session_state = {}
    session_state = request.session.session_state
    # Render the index.html template
    # This is where you would typically handle form submissions or other logic
    return render(request, 'index.html')