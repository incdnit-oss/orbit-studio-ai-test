import json
import subprocess
from unittest.mock import patch

from django.test import TestCase


class ChatViewTests(TestCase):
    def test_chat_is_restricted_to_loopback(self):
        response = self.client.post(
            "/api/chat/",
            data=json.dumps({"message": "What do you do?"}),
            content_type="application/json",
            REMOTE_ADDR="192.0.2.1",
        )

        self.assertEqual(response.status_code, 403)

    def test_chat_rejects_empty_messages(self):
        response = self.client.post(
            "/api/chat/",
            data=json.dumps({"message": "  "}),
            content_type="application/json",
            REMOTE_ADDR="127.0.0.1",
        )

        self.assertEqual(response.status_code, 400)

    @patch("studio.views.subprocess.run")
    @patch("studio.views.shutil.which", return_value="/usr/local/bin/copilot")
    def test_chat_uses_copilot_without_exposing_tools(self, _which, run):
        run.return_value = subprocess.CompletedProcess(
            args=[], returncode=0, stdout="We build brands.", stderr=""
        )

        response = self.client.post(
            "/api/chat/",
            data=json.dumps({"message": "What do you do?"}),
            content_type="application/json",
            REMOTE_ADDR="127.0.0.1",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"reply": "We build brands."})
        command = run.call_args.args[0]
        self.assertIn("--allow-all-tools", command)
        self.assertIn("--available-tools=orbit-chat-no-tools", command)
        self.assertTrue(run.call_args.kwargs["cwd"].startswith("/tmp/orbit-chat-"))
        self.assertNotIn("GITHUB_TOKEN", run.call_args.kwargs["env"])
