<?php
// GET /auth/me   (needs the token)
// Tells the front end who is logged in. Use it in auth-guard.js.

$profile = Auth::require();
Response::json(['user' => Auth::publicUser($profile)]);
