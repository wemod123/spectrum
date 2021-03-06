// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import Clipboard from 'react-clipboard.js';
import { Manager, Reference, Popper } from 'react-popper';
import { CLIENT_URL } from 'src/api/constants';
import { addToastWithTimeout } from 'src/actions/toasts';
import { openModal } from 'src/actions/modals';
import Tooltip from 'src/components/tooltip';
import Icon from 'src/components/icon';
import compose from 'recompose/compose';
import { PrimaryOutlineButton, TextButton } from 'src/components/button';
import Flyout from 'src/components/flyout';
import { LikeButton } from 'src/components/threadLikes';
import type { GetThreadType } from 'shared/graphql/queries/thread/getThread';
import toggleThreadNotificationsMutation from 'shared/graphql/mutations/thread/toggleThreadNotifications';
import OutsideClickHandler from 'src/components/outsideClickHandler';
import { track, events, transformations } from 'src/helpers/analytics';
import getThreadLink from 'src/helpers/get-thread-link';
import type { Dispatch } from 'redux';
import { InputHints, DesktopLink } from 'src/components/composer/style';
import {
  MediaLabel,
  MediaInput,
} from 'src/components/chatInput/components/style';
import {
  FollowButton,
  ShareButtons,
  ShareButton,
  ActionBarContainer,
  FixedBottomActionBarContainer,
  FlyoutRow,
  DropWrap,
  EditDone,
  Label,
} from '../style';

type Props = {
  thread: GetThreadType,
  currentUser: Object,
  isEditing: boolean,
  dispatch: Dispatch<Object>,
  toggleThreadNotifications: Function,
  toggleEdit: Function,
  saveEdit: Function,
  togglePinThread: Function,
  pinThread: Function,
  triggerDelete: Function,
  threadLock: Function,
  isSavingEdit: boolean,
  title: string,
  isLockingThread: boolean,
  isPinningThread: boolean,
  uploadFiles: Function,
};
type State = {
  notificationStateLoading: boolean,
  flyoutOpen: boolean,
  isSettingsBtnHovering: boolean,
};
class ActionBar extends React.Component<Props, State> {
  state = {
    notificationStateLoading: false,
    flyoutOpen: false,
    isSettingsBtnHovering: false,
  };

  toggleHover = () => {
    this.setState(({ isSettingsBtnHovering }) => ({
      isSettingsBtnHovering: !isSettingsBtnHovering,
    }));
  };

  toggleFlyout = val => {
    if (val) {
      return this.setState({ flyoutOpen: val });
    }

    if (this.state.flyoutOpen === false) {
      return this.setState({ flyoutOpen: true });
    } else {
      return this.setState({ flyoutOpen: false });
    }
  };

  triggerChangeChannel = () => {
    const { thread, dispatch } = this.props;

    track(events.THREAD_MOVED_INITED, {
      thread: transformations.analyticsThread(thread),
      channel: transformations.analyticsChannel(thread.channel),
      community: transformations.analyticsCommunity(thread.community),
    });

    dispatch(openModal('CHANGE_CHANNEL', { thread }));
  };

  toggleNotification = () => {
    const { thread, dispatch, toggleThreadNotifications } = this.props;
    const threadId = thread.id;

    this.setState({
      notificationStateLoading: true,
    });

    toggleThreadNotifications({
      threadId,
    })
      .then(({ data: { toggleThreadNotifications } }) => {
        this.setState({
          notificationStateLoading: false,
        });

        if (toggleThreadNotifications.receiveNotifications) {
          return dispatch(
            addToastWithTimeout('success', 'Notifications activated!')
          );
        } else {
          return dispatch(
            addToastWithTimeout('neutral', 'Notifications turned off')
          );
        }
      })
      .catch(err => {
        this.setState({
          notificationStateLoading: true,
        });
        dispatch(addToastWithTimeout('error', err.message));
      });
  };

  getThreadActionPermissions = () => {
    const { currentUser, thread } = this.props;
    const {
      channel: { channelPermissions },
      community: { communityPermissions },
    } = thread;

    const isThreadAuthor =
      currentUser && currentUser.id === thread.author.user.id;
    const isChannelModerator = currentUser && channelPermissions.isModerator;
    const isCommunityModerator =
      currentUser && communityPermissions.isModerator;
    const isChannelOwner = currentUser && channelPermissions.isOwner;
    const isCommunityOwner = currentUser && communityPermissions.isOwner;

    return {
      isThreadAuthor,
      isChannelModerator,
      isCommunityModerator,
      isChannelOwner,
      isCommunityOwner,
    };
  };

  shouldRenderEditThreadAction = () => {
    const { isThreadAuthor } = this.getThreadActionPermissions();
    return isThreadAuthor;
  };

  shouldRenderMoveThreadAction = () => {
    const {
      isCommunityOwner,
      isCommunityModerator,
    } = this.getThreadActionPermissions();

    return isCommunityModerator || isCommunityOwner;
  };

  shouldRenderLockThreadAction = () => {
    const {
      isThreadAuthor,
      isChannelModerator,
      isChannelOwner,
      isCommunityOwner,
      isCommunityModerator,
    } = this.getThreadActionPermissions();

    return (
      isThreadAuthor ||
      isChannelModerator ||
      isCommunityModerator ||
      isChannelOwner ||
      isCommunityOwner
    );
  };

  shouldRenderDeleteThreadAction = () => {
    const {
      isThreadAuthor,
      isChannelModerator,
      isChannelOwner,
      isCommunityOwner,
      isCommunityModerator,
    } = this.getThreadActionPermissions();

    return (
      isThreadAuthor ||
      isChannelModerator ||
      isCommunityModerator ||
      isChannelOwner ||
      isCommunityOwner
    );
  };

  shouldRenderPinThreadAction = () => {
    const { thread } = this.props;
    const {
      isCommunityOwner,
      isCommunityModerator,
    } = this.getThreadActionPermissions();

    return (
      !thread.channel.isPrivate && (isCommunityOwner || isCommunityModerator)
    );
  };

  shouldRenderActionsDropdown = () => {
    const {
      isThreadAuthor,
      isChannelModerator,
      isChannelOwner,
      isCommunityOwner,
      isCommunityModerator,
    } = this.getThreadActionPermissions();

    return (
      isThreadAuthor ||
      isChannelModerator ||
      isCommunityModerator ||
      isChannelOwner ||
      isCommunityOwner
    );
  };

  uploadFiles = evt => {
    this.props.uploadFiles(evt.target.files);
  };

  render() {
    const {
      thread,
      currentUser,
      isEditing,
      isSavingEdit,
      title,
      isLockingThread,
      isPinningThread,
    } = this.props;
    const {
      notificationStateLoading,
      flyoutOpen,
      isSettingsBtnHovering,
    } = this.state;
    const isPinned = thread.community.pinnedThreadId === thread.id;

    const shouldRenderActionsDropdown = this.shouldRenderActionsDropdown();
    const shouldRenderPinThreadAction = this.shouldRenderPinThreadAction();
    const shouldRenderLockThreadAction = this.shouldRenderLockThreadAction();
    const shouldRenderMoveThreadAction = this.shouldRenderMoveThreadAction();
    const shouldRenderEditThreadAction = this.shouldRenderEditThreadAction();
    const shouldRenderDeleteThreadAction = this.shouldRenderDeleteThreadAction();

    if (isEditing) {
      return (
        <FixedBottomActionBarContainer>
          <div style={{ display: 'flex' }}>
            <InputHints>
              <MediaLabel>
                <MediaInput
                  type="file"
                  accept={'.png, .jpg, .jpeg, .gif, .mp4'}
                  multiple={false}
                  onChange={this.uploadFiles}
                />
                <Icon glyph="photo" />
              </MediaLabel>
              <DesktopLink
                target="_blank"
                href="https://guides.github.com/features/mastering-markdown/"
              >
                <Icon glyph="markdown" />
              </DesktopLink>
            </InputHints>
          </div>
          <div style={{ display: 'flex' }}>
            <EditDone data-cy="cancel-thread-edit-button">
              <TextButton onClick={this.props.toggleEdit}>Cancel</TextButton>
            </EditDone>
            <EditDone>
              <PrimaryOutlineButton
                loading={isSavingEdit}
                disabled={title.trim().length === 0 || isSavingEdit}
                onClick={this.props.saveEdit}
                data-cy="save-thread-edit-button"
              >
                Save
              </PrimaryOutlineButton>
            </EditDone>
          </div>
        </FixedBottomActionBarContainer>
      );
    } else {
      return (
        <ActionBarContainer>
          <div style={{ display: 'flex' }}>
            <LikeButton thread={thread} />

            {!thread.channel.isPrivate && (
              <ShareButtons>
                <Tooltip content={'Share'}>
                  <ShareButton facebook data-cy="thread-facebook-button">
                    <a
                      href={`https://www.facebook.com/sharer/sharer.php?t=${encodeURIComponent(
                        thread.content.title
                      )}&u=https://spectrum.chat${getThreadLink(thread)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Icon
                        glyph={'facebook'}
                        size={24}
                        onClick={() =>
                          track(events.THREAD_SHARED, { method: 'facebook' })
                        }
                      />
                    </a>
                  </ShareButton>
                </Tooltip>

                <Tooltip content={'Tweet'}>
                  <ShareButton twitter data-cy="thread-tweet-button">
                    <a
                      href={`https://twitter.com/share?url=https://spectrum.chat${getThreadLink(
                        thread
                      )}&text=${encodeURIComponent(
                        thread.content.title
                      )} on @withspectrum`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Icon
                        glyph={'twitter'}
                        size={24}
                        onClick={() =>
                          track(events.THREAD_SHARED, { method: 'twitter' })
                        }
                      />
                    </a>
                  </ShareButton>
                </Tooltip>

                <Clipboard
                  style={{ background: 'none' }}
                  data-clipboard-text={`${CLIENT_URL}${getThreadLink(thread)}`}
                  onSuccess={() =>
                    this.props.dispatch(
                      addToastWithTimeout('success', 'Copied to clipboard')
                    )
                  }
                >
                  <Tooltip content={'Copy link'}>
                    <ShareButton data-cy="thread-copy-link-button">
                      <a>
                        <Icon
                          glyph={'link'}
                          size={24}
                          onClick={() =>
                            track(events.THREAD_SHARED, { method: 'link' })
                          }
                        />
                      </a>
                    </ShareButton>
                  </Tooltip>
                </Clipboard>
              </ShareButtons>
            )}
            {thread.channel.isPrivate && (
              <ShareButtons>
                <Clipboard
                  style={{ background: 'none' }}
                  data-clipboard-text={`https://spectrum.chat${getThreadLink(
                    thread
                  )}`}
                  onSuccess={() =>
                    this.props.dispatch(
                      addToastWithTimeout('success', 'Copied to clipboard')
                    )
                  }
                >
                  <Tooltip content={'Copy link'}>
                    <ShareButton data-cy="thread-copy-link-button">
                      <a>
                        <Icon
                          glyph={'link'}
                          size={24}
                          onClick={() =>
                            track(events.THREAD_SHARED, { method: 'link' })
                          }
                        />
                      </a>
                    </ShareButton>
                  </Tooltip>
                </Clipboard>
              </ShareButtons>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            {currentUser && (
              <FollowButton
                currentUser={currentUser}
                loading={notificationStateLoading}
                onClick={this.toggleNotification}
                data-cy="thread-notifications-toggle"
              >
                <Icon
                  glyph={
                    thread.receiveNotifications
                      ? 'notification-fill'
                      : 'notification'
                  }
                  size={24}
                />
                {thread.receiveNotifications ? 'Subscribed' : 'Notify me'}
              </FollowButton>
            )}

            {shouldRenderActionsDropdown && (
              <DropWrap style={{ marginRight: '8px' }}>
                <Manager>
                  <Reference>
                    {({ ref }) => {
                      return (
                        <span ref={ref}>
                          <Icon
                            glyph="settings"
                            onClick={this.toggleFlyout}
                            dataCy="thread-actions-dropdown-trigger"
                          />
                        </span>
                      );
                    }}
                  </Reference>
                  {(isSettingsBtnHovering || flyoutOpen) && (
                    <OutsideClickHandler onOutsideClick={this.toggleFlyout}>
                      <Popper
                        modifiers={{
                          flip: {
                            boundariesElement: 'viewport',
                            behavior: ['top', 'bottom', 'top'],
                          },
                          hide: { enable: false },
                        }}
                      >
                        {({ style, ref }) => {
                          return (
                            <div
                              ref={ref}
                              style={{
                                position: 'relative',
                                right: '170px',
                                top: '-40px',
                              }}
                            >
                              <Flyout
                                data-cy="thread-actions-dropdown"
                                style={style}
                              >
                                <FlyoutRow hideAbove={768}>
                                  <TextButton
                                    onClick={this.toggleNotification}
                                    data-cy={'thread-dropdown-notifications'}
                                  >
                                    <Icon
                                      size={24}
                                      glyph={
                                        thread.receiveNotifications
                                          ? 'notification-fill'
                                          : 'notification'
                                      }
                                    />
                                    {thread.receiveNotifications
                                      ? 'Subscribed'
                                      : 'Notify me'}
                                  </TextButton>
                                </FlyoutRow>

                                {shouldRenderEditThreadAction && (
                                  <FlyoutRow>
                                    <TextButton
                                      onClick={this.props.toggleEdit}
                                      data-cy={'thread-dropdown-edit'}
                                      style={{
                                        borderTop: '1px solid transparent',
                                      }}
                                    >
                                      <Icon size={24} glyph={'edit'} />
                                      <Label>Edit post</Label>
                                    </TextButton>
                                  </FlyoutRow>
                                )}

                                {shouldRenderPinThreadAction && (
                                  <FlyoutRow>
                                    <TextButton
                                      onClick={this.props.togglePinThread}
                                      data-cy={'thread-dropdown-pin'}
                                      loading={isPinningThread}
                                      disabled={isPinningThread}
                                    >
                                      <Icon
                                        size={24}
                                        glyph={isPinned ? 'pin-fill' : 'pin'}
                                      />
                                      <Label>
                                        {isPinned
                                          ? 'Unpin thread'
                                          : 'Pin thread'}
                                      </Label>
                                    </TextButton>
                                  </FlyoutRow>
                                )}

                                {shouldRenderMoveThreadAction && (
                                  <FlyoutRow hideBelow={1024}>
                                    <TextButton
                                      onClick={this.triggerChangeChannel}
                                      data-cy={'thread-dropdown-move'}
                                    >
                                      <Icon size={24} glyph={'channel'} />
                                      Move thread
                                    </TextButton>
                                  </FlyoutRow>
                                )}

                                {shouldRenderLockThreadAction && (
                                  <FlyoutRow>
                                    <TextButton
                                      onClick={this.props.threadLock}
                                      data-cy={'thread-dropdown-lock'}
                                      loading={isLockingThread}
                                      disabled={isLockingThread}
                                    >
                                      <Icon
                                        size={24}
                                        glyph={
                                          thread.isLocked
                                            ? 'private'
                                            : 'private-unlocked'
                                        }
                                      />
                                      <Label>
                                        {thread.isLocked
                                          ? 'Unlock chat'
                                          : 'Lock chat'}
                                      </Label>
                                    </TextButton>
                                  </FlyoutRow>
                                )}

                                {shouldRenderDeleteThreadAction && (
                                  <FlyoutRow>
                                    <TextButton
                                      onClick={this.props.triggerDelete}
                                      data-cy={'thread-dropdown-delete'}
                                    >
                                      <Icon size={24} glyph={'delete'} />
                                      <Label>Delete</Label>
                                    </TextButton>
                                  </FlyoutRow>
                                )}
                              </Flyout>
                            </div>
                          );
                        }}
                      </Popper>
                    </OutsideClickHandler>
                  )}
                </Manager>
              </DropWrap>
            )}
          </div>
        </ActionBarContainer>
      );
    }
  }
}

export default compose(
  connect(),
  toggleThreadNotificationsMutation
)(ActionBar);
