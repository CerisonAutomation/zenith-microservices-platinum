"""
Chat Service Tests
Tests for messaging, conversations, reactions, and moderation
"""

import pytest
from datetime import datetime, timedelta
from services.chat.models import (
    Conversation, ConversationParticipant, Message,
    MessageReaction, BlockedConversation, MessageReport
)


@pytest.mark.integration
@pytest.mark.chat
class TestConversationManagement:
    """Test conversation creation and management"""

    def test_create_conversation_success(
        self,
        client,
        create_test_user,
        test_db_session
    ):
        """Test creating a new conversation"""
        user1 = create_test_user(id="user_conv_1", email="user1@example.com")
        user2 = create_test_user(id="user_conv_2", email="user2@example.com")

        conversation_data = {
            "type": "direct",
            "name": None,
            "participant_ids": [user1.id, user2.id]
        }

        response = client.post(
            "/api/v1/chat/conversations",
            json=conversation_data
        )

        assert response.status_code == 200
        data = response.json()
        assert data["type"] == "direct"

    def test_create_group_conversation(
        self,
        client,
        create_test_user,
        test_db_session
    ):
        """Test creating a group conversation"""
        users = [
            create_test_user(id=f"group_user_{i}", email=f"user{i}@example.com")
            for i in range(3)
        ]

        conversation_data = {
            "type": "group",
            "name": "Test Group",
            "description": "Test group chat",
            "participant_ids": [user.id for user in users]
        }

        response = client.post(
            "/api/v1/chat/conversations",
            json=conversation_data
        )

        assert response.status_code == 200
        data = response.json()
        assert data["type"] == "group"
        assert data["name"] == "Test Group"

    def test_get_user_conversations(
        self,
        client,
        create_test_user,
        create_test_conversation,
        test_db_session
    ):
        """Test getting user's conversations"""
        user1 = create_test_user(id="conv_list_user_1", email="list1@example.com")
        user2 = create_test_user(id="conv_list_user_2", email="list2@example.com")

        # Create conversations
        conv1 = create_test_conversation(
            id="conv_list_1",
            participant_ids=[user1.id, user2.id]
        )
        conv2 = create_test_conversation(
            id="conv_list_2",
            participant_ids=[user1.id]
        )

        response = client.get(
            "/api/v1/chat/conversations",
            params={"user_id": user1.id}
        )

        assert response.status_code == 200
        data = response.json()
        assert "conversations" in data
        assert data["total"] >= 2

    def test_get_specific_conversation(
        self,
        client,
        create_test_user,
        create_test_conversation
    ):
        """Test getting a specific conversation"""
        user = create_test_user(id="specific_conv_user", email="specific@example.com")
        conversation = create_test_conversation(
            id="specific_conv",
            participant_ids=[user.id]
        )

        response = client.get(
            f"/api/v1/chat/conversations/specific_conv",
            params={"user_id": user.id}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "specific_conv"

    def test_update_conversation(
        self,
        client,
        create_test_user,
        test_db_session
    ):
        """Test updating conversation details"""
        user = create_test_user(id="update_conv_user", email="update@example.com")

        # Create conversation with user as owner
        conversation = Conversation(
            id="conv_to_update",
            type="group",
            name="Old Name",
            is_active=True
        )
        test_db_session.add(conversation)
        test_db_session.flush()

        participant = ConversationParticipant(
            conversation_id=conversation.id,
            user_id=user.id,
            role="owner",
            is_active=True
        )
        test_db_session.add(participant)
        test_db_session.commit()

        update_data = {
            "name": "New Name",
            "description": "Updated description"
        }

        response = client.put(
            f"/api/v1/chat/conversations/conv_to_update",
            params={"user_id": user.id},
            json=update_data
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "New Name"

    def test_delete_conversation(
        self,
        client,
        create_test_user,
        test_db_session
    ):
        """Test soft deleting a conversation"""
        user = create_test_user(id="delete_conv_user", email="delete@example.com")

        conversation = Conversation(
            id="conv_to_delete",
            type="direct",
            is_active=True
        )
        test_db_session.add(conversation)
        test_db_session.flush()

        participant = ConversationParticipant(
            conversation_id=conversation.id,
            user_id=user.id,
            role="owner",
            is_active=True
        )
        test_db_session.add(participant)
        test_db_session.commit()

        response = client.delete(
            f"/api/v1/chat/conversations/conv_to_delete",
            params={"user_id": user.id}
        )

        assert response.status_code == 200
        assert "deleted" in response.json()["message"].lower()

        # Verify soft delete
        test_db_session.refresh(conversation)
        assert conversation.is_active is False


@pytest.mark.integration
@pytest.mark.chat
class TestParticipantManagement:
    """Test conversation participant management"""

    def test_add_participant(
        self,
        client,
        create_test_user,
        test_db_session
    ):
        """Test adding a participant to conversation"""
        admin = create_test_user(id="admin_user", email="admin@example.com")
        new_user = create_test_user(id="new_participant", email="new@example.com")

        # Create conversation
        conversation = Conversation(id="conv_add_participant", type="group", is_active=True)
        test_db_session.add(conversation)
        test_db_session.flush()

        admin_participant = ConversationParticipant(
            conversation_id=conversation.id,
            user_id=admin.id,
            role="admin",
            is_active=True
        )
        test_db_session.add(admin_participant)
        test_db_session.commit()

        response = client.post(
            f"/api/v1/chat/conversations/conv_add_participant/participants",
            params={
                "participant_id": new_user.id,
                "user_id": admin.id
            }
        )

        assert response.status_code == 200
        assert "added" in response.json()["message"].lower()

    def test_remove_participant(
        self,
        client,
        create_test_user,
        test_db_session
    ):
        """Test removing a participant from conversation"""
        admin = create_test_user(id="admin_remove", email="admin_remove@example.com")
        member = create_test_user(id="member_remove", email="member_remove@example.com")

        # Create conversation
        conversation = Conversation(id="conv_remove_participant", type="group", is_active=True)
        test_db_session.add(conversation)
        test_db_session.flush()

        # Add participants
        admin_participant = ConversationParticipant(
            conversation_id=conversation.id,
            user_id=admin.id,
            role="admin",
            is_active=True
        )
        member_participant = ConversationParticipant(
            conversation_id=conversation.id,
            user_id=member.id,
            role="member",
            is_active=True
        )
        test_db_session.add(admin_participant)
        test_db_session.add(member_participant)
        test_db_session.commit()

        response = client.delete(
            f"/api/v1/chat/conversations/conv_remove_participant/participants/{member.id}",
            params={"user_id": admin.id}
        )

        assert response.status_code == 200
        assert "removed" in response.json()["message"].lower()

    def test_self_remove_from_conversation(
        self,
        client,
        create_test_user,
        test_db_session
    ):
        """Test user removing themselves from conversation"""
        user = create_test_user(id="self_remove_user", email="selfremove@example.com")

        conversation = Conversation(id="conv_self_remove", type="group", is_active=True)
        test_db_session.add(conversation)
        test_db_session.flush()

        participant = ConversationParticipant(
            conversation_id=conversation.id,
            user_id=user.id,
            role="member",
            is_active=True
        )
        test_db_session.add(participant)
        test_db_session.commit()

        response = client.delete(
            f"/api/v1/chat/conversations/conv_self_remove/participants/{user.id}",
            params={"user_id": user.id}
        )

        assert response.status_code == 200


@pytest.mark.integration
@pytest.mark.chat
class TestMessaging:
    """Test message sending and retrieval"""

    def test_send_message_success(
        self,
        client,
        create_test_user,
        sample_message_data
    ):
        """Test sending a message"""
        sender = create_test_user(
            id=sample_message_data["sender_id"],
            email="sender@example.com"
        )
        receiver = create_test_user(
            id=sample_message_data["receiver_id"],
            email="receiver@example.com"
        )

        response = client.post(
            "/api/v1/chat/messages",
            json=sample_message_data
        )

        assert response.status_code == 200
        data = response.json()
        assert data["content"] == sample_message_data["content"]
        assert data["sender_id"] == sample_message_data["sender_id"]
        assert data["receiver_id"] == sample_message_data["receiver_id"]

    def test_send_message_to_self(
        self,
        client,
        create_test_user
    ):
        """Test that user cannot send message to themselves"""
        user = create_test_user(id="self_message_user", email="self@example.com")

        message_data = {
            "sender_id": user.id,
            "receiver_id": user.id,
            "content": "Message to myself",
            "message_type": "text",
            "conversation_id": "conv_123"
        }

        response = client.post(
            "/api/v1/chat/messages",
            json=message_data
        )

        assert response.status_code == 400
        assert "yourself" in response.json()["detail"].lower()

    def test_get_messages_for_conversation(
        self,
        client,
        create_test_user,
        test_db_session
    ):
        """Test retrieving messages for a conversation"""
        user1 = create_test_user(id="msg_user_1", email="msg1@example.com")
        user2 = create_test_user(id="msg_user_2", email="msg2@example.com")

        # Create conversation
        conversation = Conversation(id="conv_messages", type="direct", is_active=True)
        test_db_session.add(conversation)
        test_db_session.flush()

        participant = ConversationParticipant(
            conversation_id=conversation.id,
            user_id=user1.id,
            is_active=True
        )
        test_db_session.add(participant)

        # Create messages
        for i in range(3):
            message = Message(
                id=f"msg_{i}",
                conversation_id=conversation.id,
                sender_id=user1.id,
                receiver_id=user2.id,
                content=f"Test message {i}",
                message_type="text"
            )
            test_db_session.add(message)

        test_db_session.commit()

        response = client.get(
            f"/api/v1/chat/conversations/conv_messages/messages",
            params={"user_id": user1.id, "limit": 50}
        )

        assert response.status_code == 200
        data = response.json()
        assert "messages" in data
        assert len(data["messages"]) == 3

    def test_get_user_messages(
        self,
        client,
        create_test_user,
        test_db_session
    ):
        """Test getting all messages for a user"""
        user = create_test_user(id="all_msg_user", email="allmsg@example.com")
        other_user = create_test_user(id="other_msg_user", email="other@example.com")

        # Create messages
        message = Message(
            id="user_msg_1",
            sender_id=user.id,
            receiver_id=other_user.id,
            content="Test message",
            message_type="text",
            conversation_id="conv_123"
        )
        test_db_session.add(message)
        test_db_session.commit()

        response = client.get(
            f"/api/v1/chat/messages/{user.id}",
            params={"limit": 50}
        )

        assert response.status_code == 200
        messages = response.json()
        assert len(messages) > 0

    def test_mark_message_as_read(
        self,
        client,
        create_test_user,
        test_db_session
    ):
        """Test marking a message as read"""
        sender = create_test_user(id="mark_read_sender", email="sender_read@example.com")
        receiver = create_test_user(id="mark_read_receiver", email="receiver_read@example.com")

        message = Message(
            id="msg_mark_read",
            sender_id=sender.id,
            receiver_id=receiver.id,
            content="Unread message",
            message_type="text",
            is_read=False,
            conversation_id="conv_123"
        )
        test_db_session.add(message)
        test_db_session.commit()

        response = client.put(
            f"/api/v1/chat/messages/msg_mark_read/read",
            params={"user_id": receiver.id}
        )

        assert response.status_code == 200

        # Verify message is marked as read
        test_db_session.refresh(message)
        assert message.is_read is True
        assert message.read_at is not None


@pytest.mark.integration
@pytest.mark.chat
class TestMessageReactions:
    """Test message reactions"""

    def test_add_reaction_success(
        self,
        client,
        create_test_user,
        test_db_session
    ):
        """Test adding a reaction to a message"""
        user = create_test_user(id="reaction_user", email="reaction@example.com")
        sender = create_test_user(id="reaction_sender", email="sender_react@example.com")

        # Create conversation and participant
        conversation = Conversation(id="conv_reactions", type="direct", is_active=True)
        test_db_session.add(conversation)
        test_db_session.flush()

        participant = ConversationParticipant(
            conversation_id=conversation.id,
            user_id=user.id,
            is_active=True
        )
        test_db_session.add(participant)

        # Create message
        message = Message(
            id="msg_reaction",
            conversation_id=conversation.id,
            sender_id=sender.id,
            receiver_id=user.id,
            content="React to me!",
            message_type="text",
            is_deleted=False
        )
        test_db_session.add(message)
        test_db_session.commit()

        response = client.post(
            f"/api/v1/chat/messages/msg_reaction/reactions",
            params={
                "reaction": "❤️",
                "user_id": user.id
            }
        )

        assert response.status_code == 200
        assert "added" in response.json()["message"].lower()

    def test_remove_reaction(
        self,
        client,
        create_test_user,
        test_db_session
    ):
        """Test removing a reaction from a message"""
        user = create_test_user(id="remove_reaction_user", email="remove_react@example.com")
        sender = create_test_user(id="remove_reaction_sender", email="sender2@example.com")

        # Create message
        message = Message(
            id="msg_remove_reaction",
            sender_id=sender.id,
            receiver_id=user.id,
            content="Test message",
            message_type="text",
            conversation_id="conv_123"
        )
        test_db_session.add(message)
        test_db_session.flush()

        # Add reaction
        reaction = MessageReaction(
            message_id=message.id,
            user_id=user.id,
            reaction="❤️"
        )
        test_db_session.add(reaction)
        test_db_session.commit()

        response = client.delete(
            f"/api/v1/chat/messages/msg_remove_reaction/reactions/❤️",
            params={"user_id": user.id}
        )

        assert response.status_code == 200


@pytest.mark.integration
@pytest.mark.chat
class TestConversationBlocking:
    """Test conversation blocking and unblocking"""

    def test_block_conversation(
        self,
        client,
        create_test_user,
        test_db_session
    ):
        """Test blocking a conversation"""
        user = create_test_user(id="block_user", email="block@example.com")

        response = client.post(
            "/api/v1/chat/conversations/conv_to_block/block",
            params={
                "user_id": user.id,
                "reason": "Spam"
            }
        )

        assert response.status_code == 200
        assert "blocked" in response.json()["message"].lower()

    def test_unblock_conversation(
        self,
        client,
        create_test_user,
        test_db_session
    ):
        """Test unblocking a conversation"""
        user = create_test_user(id="unblock_user", email="unblock@example.com")

        # Block conversation first
        block = BlockedConversation(
            conversation_id="conv_to_unblock",
            user_id=user.id,
            reason="Test block"
        )
        test_db_session.add(block)
        test_db_session.commit()

        response = client.delete(
            "/api/v1/chat/conversations/conv_to_unblock/block",
            params={"user_id": user.id}
        )

        assert response.status_code == 200
        assert "unblocked" in response.json()["message"].lower()


@pytest.mark.integration
@pytest.mark.chat
class TestMessageReporting:
    """Test message reporting and moderation"""

    def test_report_message(
        self,
        client,
        create_test_user,
        test_db_session
    ):
        """Test reporting a message"""
        reporter = create_test_user(id="reporter_user", email="reporter@example.com")
        sender = create_test_user(id="reported_sender", email="reported@example.com")

        # Create message
        message = Message(
            id="msg_to_report",
            sender_id=sender.id,
            receiver_id=reporter.id,
            content="Inappropriate content",
            message_type="text",
            is_deleted=False,
            conversation_id="conv_123"
        )
        test_db_session.add(message)
        test_db_session.commit()

        report_data = {
            "reason": "harassment",
            "description": "This message is inappropriate"
        }

        response = client.post(
            "/api/v1/chat/messages/msg_to_report/report",
            params={"user_id": reporter.id},
            json=report_data
        )

        assert response.status_code == 200
        assert "reported" in response.json()["message"].lower()

    def test_cannot_report_twice(
        self,
        client,
        create_test_user,
        test_db_session
    ):
        """Test that user cannot report same message twice"""
        reporter = create_test_user(id="double_reporter", email="double@example.com")
        sender = create_test_user(id="double_reported", email="double_reported@example.com")

        # Create message
        message = Message(
            id="msg_double_report",
            sender_id=sender.id,
            receiver_id=reporter.id,
            content="Test message",
            message_type="text",
            is_deleted=False,
            conversation_id="conv_123"
        )
        test_db_session.add(message)
        test_db_session.flush()

        # Create existing report
        report = MessageReport(
            message_id=message.id,
            reporter_id=reporter.id,
            reason="spam",
            description="Test report"
        )
        test_db_session.add(report)
        test_db_session.commit()

        report_data = {
            "reason": "harassment",
            "description": "Another report"
        }

        response = client.post(
            "/api/v1/chat/messages/msg_double_report/report",
            params={"user_id": reporter.id},
            json=report_data
        )

        assert response.status_code == 400
        assert "already reported" in response.json()["detail"].lower()


@pytest.mark.integration
@pytest.mark.chat
class TestChatStatistics:
    """Test chat system statistics"""

    def test_get_chat_stats(self, client):
        """Test getting chat system statistics"""
        response = client.get("/api/v1/chat/stats")

        assert response.status_code == 200
        data = response.json()
        assert "total_conversations" in data
        assert "total_messages" in data
        assert "active_users" in data
